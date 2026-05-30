import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Clock, CalendarClock, RefreshCw,
  CheckCircle2, XCircle, Loader2, AlertTriangle,
} from 'lucide-react'
import { bibliotecaService } from '@/services'
import { useBibliotecaStore } from '@/store/bibliotecaStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { StatusChip } from '@/components/shared/StatusChip'
import { toast } from 'sonner'
import { formatDateTime, minutesUntil } from '@/lib/utils'
import type { TipoSolicitacao, Solicitacao } from '@/types'
import type { DisponibilidadeResult } from '@/services/BibliotecaService'

type Etapa = 'escolher_tipo' | 'configurar' | 'checando' | 'disponivel' | 'bloqueado' | 'confirmado'

export function AlunoHome() {
  const navigate = useNavigate()
  const store = useBibliotecaStore()
  const usuarioLogadoId = store.ui.usuarioLogadoId!
  const usuario = store.usuarios.find((u) => u.id === usuarioLogadoId)!

  const emprestimoAberto = store.emprestimos.find(
    (e) => e.alunoId === usuarioLogadoId && e.dataDevolucao === null
  )
  const livroEmprestado = emprestimoAberto
    ? store.livros.find((l) => l.id === emprestimoAberto.livroId)
    : null

  // Sessão ativa — redirecionar para totem
  const sessaoAtiva = store.sessoes.find(
    (s) => s.alunoId === usuarioLogadoId && (s.status === 'ativa' || s.status === 'aguardando_saida')
  )
  useEffect(() => {
    if (sessaoAtiva) navigate('/aluno/sessao')
  }, [sessaoAtiva, navigate])

  const [etapa, setEtapa] = useState<Etapa>('escolher_tipo')
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoSolicitacao | null>(null)
  const [tempoMin, setTempoMin] = useState<number>(60)
  const [dataAgendada, setDataAgendada] = useState('')
  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeResult | null>(null)
  const [solicitacaoCriada, setSolicitacaoCriada] = useState<Solicitacao | null>(null)
  const [loading, setLoading] = useState(false)

  const config = store.config
  const cooldownRestante = usuario.cooldownAte ? minutesUntil(usuario.cooldownAte) : 0

  // Solicitações recentes deste aluno
  const solicitacoesRecentes = store.solicitacoes
    .filter((s) => s.alunoId === usuarioLogadoId)
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
    .slice(0, 3)

  function selecionarTipo(tipo: TipoSolicitacao) {
    // RN6 — bloquear tipos que não são devolução se tem livro pendente
    if (emprestimoAberto && tipo !== 'devolucao') {
      toast.error('Você tem um livro pendente. Use o tipo "Devolução".')
      return
    }
    if (!emprestimoAberto && tipo === 'devolucao') {
      toast.error('Você não possui livro para devolver.')
      return
    }
    setTipoSelecionado(tipo)
    setEtapa('configurar')
  }

  async function checarDisponibilidade() {
    if (!tipoSelecionado) return
    setEtapa('checando')
    setLoading(true)
    try {
      if (tipoSelecionado === 'agora' || tipoSelecionado === 'devolucao') {
        const result = await bibliotecaService.verificarDisponibilidade()
        setDisponibilidade(result)
        setEtapa(result.disponivel ? 'disponivel' : 'bloqueado')
      } else {
        // Agendada: não checa disponibilidade imediata, vai direto
        setEtapa('disponivel')
        setDisponibilidade({ disponivel: true, motivos: [], capacidadeOk: true, cooldownOk: true, agendaOk: true })
      }
    } catch {
      toast.error('Erro ao verificar disponibilidade')
      setEtapa('configurar')
    } finally {
      setLoading(false)
    }
  }

  async function enviarSolicitacao() {
    if (!tipoSelecionado) return
    setLoading(true)
    try {
      const sol = await bibliotecaService.solicitarAcesso(
        tipoSelecionado,
        tempoMin,
        tipoSelecionado === 'agendada' ? dataAgendada : undefined
      )
      setSolicitacaoCriada(sol)
      setEtapa('confirmado')
      toast.success('Solicitação enviada! Aguarde a confirmação presencial.')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao solicitar acesso')
      setEtapa('disponivel')
    } finally {
      setLoading(false)
    }
  }

  function reiniciar() {
    setEtapa('escolher_tipo')
    setTipoSelecionado(null)
    setTempoMin(60)
    setDataAgendada('')
    setDisponibilidade(null)
    setSolicitacaoCriada(null)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="headline-lg">Olá, {usuario.nome.split(' ')[0]}</h1>
        <p className="body-sm text-[var(--muted-foreground)] mt-1">
          O que você precisa hoje?
        </p>
      </div>

      {/* Banner livro pendente */}
      {emprestimoAberto && livroEmprestado && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Livro pendente de devolução</AlertTitle>
          <AlertDescription>
            <strong>{livroEmprestado.titulo}</strong> — devolver até{' '}
            {formatDateTime(emprestimoAberto.dataPrevista)}
          </AlertDescription>
        </Alert>
      )}

      {/* Banner cooldown */}
      {cooldownRestante > 0 && (
        <Alert variant="warning" className="mb-6">
          <Clock className="w-4 h-4" />
          <AlertTitle>Cooldown ativo</AlertTitle>
          <AlertDescription>
            Aguarde mais <strong>{cooldownRestante} min</strong> para solicitar novo acesso.
          </AlertDescription>
        </Alert>
      )}

      {/* Etapa: escolher tipo */}
      {etapa === 'escolher_tipo' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TipoCard
            titulo="Acesso agora"
            descricao="Entrar na biblioteca imediatamente"
            icone={<BookOpen className="w-6 h-6" />}
            onClick={() => selecionarTipo('agora')}
            bloqueado={!!emprestimoAberto || cooldownRestante > 0}
            motivoBloqueio={
              emprestimoAberto ? 'Tem livro pendente' :
              cooldownRestante > 0 ? `Cooldown: ${cooldownRestante} min` : undefined
            }
          />
          <TipoCard
            titulo="Agendar acesso"
            descricao="Reservar para uma data e hora futura"
            icone={<CalendarClock className="w-6 h-6" />}
            onClick={() => selecionarTipo('agendada')}
            bloqueado={!!emprestimoAberto}
            motivoBloqueio={emprestimoAberto ? 'Tem livro pendente' : undefined}
          />
          <TipoCard
            titulo="Devolução"
            descricao="Entrar somente para devolver livro"
            icone={<RefreshCw className="w-6 h-6" />}
            onClick={() => selecionarTipo('devolucao')}
            bloqueado={!emprestimoAberto}
            motivoBloqueio={!emprestimoAberto ? 'Sem livro pendente' : undefined}
          />
        </div>
      )}

      {/* Etapa: configurar */}
      {etapa === 'configurar' && tipoSelecionado && (
        <Card>
          <CardHeader>
            <CardTitle>
              {tipoSelecionado === 'agora' && 'Acesso agora'}
              {tipoSelecionado === 'agendada' && 'Agendar acesso'}
              {tipoSelecionado === 'devolucao' && 'Acesso para devolução'}
            </CardTitle>
            <CardDescription>Informe por quanto tempo vai ficar (RN3)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tempo">
                Tempo estimado (min) — máx: {config.tempoMaxSessaoMin} min
              </Label>
              <Input
                id="tempo"
                type="number"
                min={5}
                max={config.tempoMaxSessaoMin}
                value={tempoMin}
                onChange={(e) => setTempoMin(Math.min(Number(e.target.value), config.tempoMaxSessaoMin))}
              />
            </div>

            {tipoSelecionado === 'agendada' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="data">Data e hora</Label>
                <Input
                  id="data"
                  type="datetime-local"
                  value={dataAgendada}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setDataAgendada(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={reiniciar} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={checarDisponibilidade}
                disabled={loading || tempoMin < 5 || (tipoSelecionado === 'agendada' && !dataAgendada)}
                className="flex-1"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar disponibilidade'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapa: checando */}
      {etapa === 'checando' && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="w-10 h-10 text-[#9b1b22] animate-spin" />
            <p className="body-lg text-[var(--muted-foreground)]">Verificando disponibilidade…</p>
          </CardContent>
        </Card>
      )}

      {/* Etapa: bloqueado */}
      {etapa === 'bloqueado' && disponibilidade && (
        <Card>
          <CardContent className="flex flex-col gap-4 py-8">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-[#9b1b22] flex-shrink-0" />
              <div>
                <p className="font-semibold text-[var(--foreground)]">Acesso não disponível</p>
                <p className="body-sm text-[var(--muted-foreground)]">Motivos:</p>
              </div>
            </div>
            <ul className="flex flex-col gap-2 pl-4">
              {disponibilidade.motivos.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-[#9b1b22] mt-0.5">•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={reiniciar} className="flex-1">
                Voltar
              </Button>
              <Button onClick={() => selecionarTipo('agendada')} variant="outline" className="flex-1">
                Agendar para outro horário
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapa: disponivel */}
      {etapa === 'disponivel' && tipoSelecionado && (
        <Card>
          <CardContent className="flex flex-col gap-4 py-8">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-[var(--foreground)]">
                  {tipoSelecionado === 'agendada' ? 'Horário disponível' : 'Sala disponível!'}
                </p>
                <p className="body-sm text-[var(--muted-foreground)]">
                  Tempo estimado: <strong>{tempoMin} min</strong>
                  {tipoSelecionado === 'agendada' && dataAgendada && (
                    <> • Agendado para: <strong>{formatDateTime(new Date(dataAgendada).toISOString())}</strong></>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setEtapa('configurar')} className="flex-1">
                Ajustar
              </Button>
              <Button onClick={enviarSolicitacao} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar solicitação'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapa: confirmado */}
      {etapa === 'confirmado' && solicitacaoCriada && (
        <Card>
          <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-600" />
            <div>
              <p className="headline-md">Solicitação enviada!</p>
              <p className="body-sm text-[var(--muted-foreground)] mt-1">
                {solicitacaoCriada.tipo === 'agendada'
                  ? 'Sua reserva foi registrada. Chegue no horário marcado e aguarde a confirmação presencial do Colaborador.'
                  : 'Dirija-se à biblioteca. O Colaborador irá confirmar sua entrada presencialmente.'}
              </p>
            </div>
            <StatusChip status={solicitacaoCriada.status} />
            <p className="label-md text-[var(--muted-foreground)]">{solicitacaoCriada.id.toUpperCase()}</p>
            <Button variant="outline" onClick={reiniciar} size="sm">
              Nova solicitação
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Histórico recente */}
      {solicitacoesRecentes.length > 0 && etapa === 'escolher_tipo' && (
        <div className="section-gap">
          <h2 className="headline-md mb-4">Solicitações recentes</h2>
          <div className="flex flex-col gap-3">
            {solicitacoesRecentes.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]"
              >
                <div>
                  <p className="text-sm font-medium capitalize">
                    {s.tipo === 'agora' ? 'Acesso imediato' : s.tipo === 'agendada' ? 'Agendado' : 'Devolução'}
                  </p>
                  <p className="label-md text-[var(--muted-foreground)]">{formatDateTime(s.criadoEm)}</p>
                </div>
                <StatusChip status={s.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface TipoCardProps {
  titulo: string
  descricao: string
  icone: React.ReactNode
  onClick: () => void
  bloqueado: boolean
  motivoBloqueio?: string
}

function TipoCard({ titulo, descricao, icone, onClick, bloqueado, motivoBloqueio }: TipoCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={bloqueado}
      className={`group flex flex-col gap-3 p-5 rounded-lg border-2 text-left transition-all duration-150 cursor-pointer
        ${bloqueado
          ? 'border-[var(--border)] bg-[var(--secondary)] opacity-50 cursor-not-allowed'
          : 'border-[var(--border)] bg-[var(--card)] hover:border-[#9b1b22] hover:shadow-md'
        }`}
    >
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform ${bloqueado ? 'bg-[var(--muted)] text-[var(--muted-foreground)]' : 'bg-[#fef2f2] text-[#9b1b22] group-hover:scale-110'}`}
      >
        {icone}
      </div>
      <div>
        <p className="font-semibold text-[var(--foreground)]">{titulo}</p>
        <p className="body-sm text-[var(--muted-foreground)] mt-0.5">{descricao}</p>
        {bloqueado && motivoBloqueio && (
          <p className="label-md text-[#9b1b22] mt-1">{motivoBloqueio}</p>
        )}
      </div>
    </button>
  )
}
