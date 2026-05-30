import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wifi, BookOpen, CheckCircle2, XCircle, Loader2,
  LogOut, Camera, AlertTriangle,
} from 'lucide-react'
import { bibliotecaService, acervoService, adminService } from '@/services'
import { useBibliotecaStore } from '@/store/bibliotecaStore'
import { usePolling } from '@/hooks/usePolling'
import { LeitorRFID, useLeitorRFIDStore } from '@/mocks/hardware/LeitorRFID'
import { Tranca } from '@/mocks/hardware/Tranca'
import { Webcam, useWebcamStore } from '@/mocks/hardware/Webcam'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CountdownTimer } from '@/components/shared/CountdownTimer'
import { toast } from 'sonner'
import { generateId } from '@/lib/utils'
import type { Sessao } from '@/types'

type Fase =
  | 'boas_vindas'
  | 'lendo'
  | 'escolher_dias'
  | 'livro_registrado'
  | 'devolvendo'
  | 'webcam'
  | 'aguardando_saida'
  | 'encerrada'

export function TotemSessao() {
  const navigate = useNavigate()
  const store = useBibliotecaStore()
  const usuarioLogadoId = store.ui.usuarioLogadoId!
  const usuario = store.usuarios.find((u) => u.id === usuarioLogadoId)!

  const sessaoAtual = store.sessoes.find(
    (s) => s.alunoId === usuarioLogadoId && (s.status === 'ativa' || s.status === 'aguardando_saida')
  )

  const rfidEstado = useLeitorRFIDStore((s) => s.estado)
  const rfidTag = useLeitorRFIDStore((s) => s.tagLida)
  const webcamEstado = useWebcamStore((s) => s.estado)

  const [fase, setFase] = useState<Fase>('boas_vindas')
  const [dias, setDias] = useState<number>(store.config.diasPadraoEmprestimo)
  const [livroSelecionadoId, setLivroSelecionadoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessao, setSessao] = useState<Sessao | null>(sessaoAtual ?? null)

  // Sem sessão → volta para home
  useEffect(() => {
    if (!sessaoAtual && fase !== 'encerrada') navigate('/aluno')
    if (sessaoAtual) setSessao(sessaoAtual)
  }, [sessaoAtual, fase, navigate])

  // Carrega acervo real (simulador RFID + lookup de tag), config e empréstimo ativo.
  useEffect(() => {
    acervoService.listarLivros().then((l) => useBibliotecaStore.getState().setLivros(l)).catch(() => {})
    adminService.getConfig().then((c) => useBibliotecaStore.getState().setConfig(c)).catch(() => {})
    bibliotecaService.getEmprestimoAtivo().catch(() => {})
  }, [])

  // Backend: detecta confirmação de saída do colaborador → sessão encerra → home.
  usePolling(() => {
    void bibliotecaService.getSessaoAtual()
  }, 4000)

  // Determina se é sessão de devolução
  const solicitacao = sessao ? store.solicitacoes.find((s) => s.id === sessao.solicitacaoId) : null
  const isDevolucao = solicitacao?.tipo === 'devolucao'

  const emprestimoAberto = store.emprestimos.find(
    (e) => e.alunoId === usuarioLogadoId && e.dataDevolucao === null
  )
  const livroEmprestado = emprestimoAberto
    ? store.livros.find((l) => l.id === emprestimoAberto.livroId)
    : null

  const livrosDisponiveis = store.livros.filter((l) => l.disponivel)

  async function iniciarBip() {
    setFase('lendo')
    try {
      const tag = await LeitorRFID.ler()
      const livro = store.livros.find((l) => l.tagRfid === tag)
      if (!livro) {
        toast.error('Tag RFID não reconhecida')
        setFase('boas_vindas')
        return
      }
      if (!livro.disponivel) {
        toast.error('Livro não disponível')
        setFase('boas_vindas')
        return
      }
      setLivroSelecionadoId(livro.id)
      setFase('escolher_dias')
    } catch {
      setFase('boas_vindas')
    }
  }

  function simularRFID(livroId: string) {
    const livro = store.livros.find((l) => l.id === livroId)
    if (livro) LeitorRFID.simularLeitura(livro.tagRfid)
  }

  async function confirmarPegouLivro() {
    if (!sessao || !livroSelecionadoId) return
    setLoading(true)
    try {
      const sessaoAtualizada = await bibliotecaService.pegarLivro(sessao.id, livroSelecionadoId, dias)
      setSessao(sessaoAtualizada)
      setFase('livro_registrado')
      await Tranca.abrir()
      toast.success('Livro registrado! Dirija-se à saída.')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao registrar livro')
    } finally {
      setLoading(false)
    }
  }

  async function iniciarDevolucao() {
    setFase('devolvendo')
    try {
      const tag = await LeitorRFID.ler()
      const livro = store.livros.find((l) => l.tagRfid === tag)
      if (!livro || !emprestimoAberto || livro.id !== emprestimoAberto.livroId) {
        toast.error('Livro não corresponde ao empréstimo ativo')
        setFase('boas_vindas')
        return
      }
      setLivroSelecionadoId(livro.id)
      // Após bipar, acionar webcam (RN da devolução)
      setFase('webcam')
      const confirmado = await Webcam.confirmarLivro()
      if (confirmado) {
        const sessaoAtualizada = await bibliotecaService.devolverLivro(sessao!.id, livro.id)
        setSessao(sessaoAtualizada)
        toast.success('Livro devolvido com sucesso!')
        setFase('aguardando_saida')
        await Tranca.abrir()
      } else {
        // Webcam não confirmou — gerar alerta (RN da devolução)
        store.addAlerta({
          id: generateId('alerta'),
          tipo: 'webcam_falhou',
          descricao: `Webcam não confirmou devolução do livro "${livro.titulo}" — sessão do aluno ${usuario.nome}`,
          criadoEm: new Date().toISOString(),
          resolvido: false,
          sessaoId: sessao!.id,
          alunoId: usuarioLogadoId,
        })
        toast.error('Webcam não detectou o livro. Alerta gerado para o Colaborador.')
        setFase('aguardando_saida')
      }
    } catch {
      setFase('boas_vindas')
    }
  }

  // Ao entrar na sessão de devolução, inicia direto a leitura RFID do livro a devolver.
  // (apenas setFase('devolvendo') deixava a tela travada: o leitor nunca era acionado,
  //  então o card de RFID — que exige rfidEstado === 'aguardando' — nunca aparecia)
  useEffect(() => {
    if (isDevolucao && fase === 'boas_vindas' && sessao?.status === 'ativa') {
      void iniciarDevolucao()
    }
  }, [isDevolucao, fase, sessao])

  async function pedirSaida() {
    if (!sessao) return
    setLoading(true)
    try {
      const sessaoAtualizada = await bibliotecaService.sairSemLivro(sessao.id)
      setSessao(sessaoAtualizada)
      setFase('aguardando_saida')
      await Tranca.abrir()
      toast.info('Dirija-se à saída. O Colaborador irá confirmar.')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao solicitar saída')
    } finally {
      setLoading(false)
    }
  }

  if (!sessao) return null

  return (
    <div className="max-w-xl mx-auto">
      {/* Cabeçalho da sessão */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="headline-lg">
            {isDevolucao ? 'Devolução de livro' : 'Sessão ativa'}
          </h1>
          <p className="body-sm text-[var(--muted-foreground)] mt-1">
            {usuario.nome} • {sessao.id.toUpperCase()}
          </p>
        </div>
        <div className={`px-3 py-1 rounded border label-md ${
          sessao.status === 'ativa' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-amber-50 text-amber-700 border-amber-300'
        }`}>
          {sessao.status === 'ativa' ? 'EM SESSÃO' : 'AGUARDANDO SAÍDA'}
        </div>
      </div>

      {/* Contador regressivo */}
      {sessao.status === 'ativa' && (
        <Card className="mb-6">
          <CardContent className="py-6">
            <CountdownTimer
              inicioIso={sessao.inicio}
              duracaoMin={sessao.tempoEstimadoMin}
              onExpired={() => toast.warning('Tempo estimado esgotado — por favor encerre a sessão')}
            />
          </CardContent>
        </Card>
      )}

      {/* FASE: boas_vindas */}
      {fase === 'boas_vindas' && sessao.status === 'ativa' && (
        <Card>
          <CardHeader>
            <CardTitle>O que deseja fazer?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="justify-start gap-3 h-14"
              onClick={iniciarBip}
            >
              <Wifi className="w-5 h-5 text-[#9b1b22]" />
              <div className="text-left">
                <p className="font-semibold">Pegar livro</p>
                <p className="label-md text-[var(--muted-foreground)]">BIPAR TAG RFID</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-3 h-14"
              onClick={pedirSaida}
              disabled={loading}
            >
              <LogOut className="w-5 h-5 text-[var(--muted-foreground)]" />
              <div className="text-left">
                <p className="font-semibold">Sair sem livro</p>
                <p className="label-md text-[var(--muted-foreground)]">ENCERRAR SESSÃO</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* FASE: lendo (aguardando RFID) */}
      {(fase === 'lendo' || (fase === 'devolvendo' && rfidEstado === 'aguardando')) && (
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-10">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#fef2f2] flex items-center justify-center">
                <Wifi className="w-10 h-10 text-[#9b1b22] animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-[#9b1b22] animate-ping opacity-30" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-[var(--foreground)]">Aguardando leitura RFID…</p>
              <p className="body-sm text-[var(--muted-foreground)] mt-1">Passe o livro no leitor</p>
            </div>

            {/* Simulação de RFID — apenas para demo */}
            <div className="w-full border-t border-[var(--border)] pt-4">
              <p className="label-md text-[var(--muted-foreground)] mb-3 text-center">SIMULADOR RFID (DEMO)</p>
              <div className="flex flex-col gap-2">
                {(fase === 'devolvendo' && livroEmprestado ? [livroEmprestado] : livrosDisponiveis).map((livro) => (
                  <button
                    key={livro.id}
                    onClick={() => simularRFID(livro.id)}
                    className="flex items-center justify-between p-3 rounded border border-[var(--border)] hover:border-[#9b1b22] hover:bg-[#fef2f2] transition-colors text-sm"
                  >
                    <div className="text-left">
                      <p className="font-medium">{livro.titulo}</p>
                      <p className="label-md text-[var(--muted-foreground)]">{livro.tagRfid}</p>
                    </div>
                    <Wifi className="w-4 h-4 text-[#9b1b22]" />
                  </button>
                ))}
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => { LeitorRFID.cancelar(); setFase('boas_vindas') }}>
              Cancelar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* FASE: escolher_dias */}
      {fase === 'escolher_dias' && livroSelecionadoId && (
        <Card>
          <CardContent className="flex flex-col gap-5 py-6">
            <div className="flex items-center gap-3 p-3 rounded bg-[#fef2f2] border border-red-200">
              <BookOpen className="w-5 h-5 text-[#9b1b22]" />
              <div>
                <p className="font-semibold text-sm">
                  {store.livros.find((l) => l.id === livroSelecionadoId)?.titulo}
                </p>
                <p className="label-md text-[var(--muted-foreground)]">TAG LIDA COM SUCESSO</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="dias">Por quantos dias? (máx: {store.config.diasPadraoEmprestimo})</Label>
              <Input
                id="dias"
                type="number"
                min={1}
                max={store.config.diasPadraoEmprestimo}
                value={dias}
                onChange={(e) => setDias(Math.min(Number(e.target.value), store.config.diasPadraoEmprestimo))}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { LeitorRFID.cancelar(); setFase('boas_vindas') }} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={confirmarPegouLivro} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar empréstimo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE: livro_registrado */}
      {fase === 'livro_registrado' && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-600" />
            <p className="headline-md">Livro registrado!</p>
            <p className="body-sm text-[var(--muted-foreground)]">
              Dirija-se à saída e aguarde a confirmação presencial do Colaborador.
            </p>
          </CardContent>
        </Card>
      )}

      {/* FASE: webcam */}
      {fase === 'webcam' && (
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-10">
            {webcamEstado === 'analisando' ? (
              <>
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#fef2f2] flex items-center justify-center">
                    <Camera className="w-10 h-10 text-[#9b1b22]" />
                  </div>
                  <Loader2 className="absolute -bottom-1 -right-1 w-6 h-6 text-[#9b1b22] animate-spin" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Verificando livro com webcam…</p>
                  <p className="body-sm text-[var(--muted-foreground)] mt-1">
                    Posicione o livro na mesinha em frente à câmera
                  </p>
                </div>
                {/* Simulação para demo */}
                <div className="flex gap-3 w-full">
                  <Button variant="outline" className="flex-1" onClick={() => Webcam.simularResultado(false)}>
                    <XCircle className="w-4 h-4 mr-2 text-[#9b1b22]" /> Simular: não detectado
                  </Button>
                  <Button className="flex-1" onClick={() => Webcam.simularResultado(true)}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Simular: detectado
                  </Button>
                </div>
              </>
            ) : webcamEstado === 'confirmado' ? (
              <CheckCircle2 className="w-14 h-14 text-green-600" />
            ) : webcamEstado === 'nao_confirmado' ? (
              <>
                <XCircle className="w-14 h-14 text-[#9b1b22]" />
                <div className="text-center">
                  <p className="font-semibold text-[#9b1b22]">Livro não detectado</p>
                  <p className="body-sm text-[var(--muted-foreground)] mt-1">Alerta gerado para o Colaborador.</p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* FASE: aguardando_saida */}
      {(fase === 'aguardando_saida' || sessao.status === 'aguardando_saida') && fase !== 'webcam' && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500" />
            <p className="headline-md">Aguardando confirmação de saída</p>
            <p className="body-sm text-[var(--muted-foreground)]">
              Dirija-se à saída. O Colaborador irá confirmar sua saída presencialmente.
            </p>
            <div className="px-4 py-2 rounded bg-amber-50 border border-amber-300">
              <p className="label-md text-amber-700">SESSÃO: {sessao.id.toUpperCase()}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
