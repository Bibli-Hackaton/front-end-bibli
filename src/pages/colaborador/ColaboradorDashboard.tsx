import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, XCircle, Clock, AlertTriangle, Loader2, Users, BookOpen } from 'lucide-react'
import { bibliotecaService, solicitacaoService } from '@/services'
import { useBibliotecaStore } from '@/store/bibliotecaStore'
import { usePolling } from '@/hooks/usePolling'
import { Tranca } from '@/mocks/hardware/Tranca'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { StatusChip } from '@/components/shared/StatusChip'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'
import type { SolicitacaoComAluno } from '@/services/SolicitacaoService'
import type { BibliotecaState } from '@/store/bibliotecaStore'

export function ColaboradorDashboard() {
  const store = useBibliotecaStore()
  const [pendentes, setPendentes] = useState<SolicitacaoComAluno[]>([])
  const [reservas, setReservas] = useState<SolicitacaoComAluno[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const alertasAtivos = store.alertas.filter((a) => !a.resolvido)
  const sessaoAtiva = store.sessoes.find((s) => s.status === 'ativa' || s.status === 'aguardando_saida')
  const alunoNaSessao = sessaoAtiva ? store.usuarios.find((u) => u.id === sessaoAtiva.alunoId) : null
  const livroNaSessao = sessaoAtiva?.livroVinculadoId
    ? store.livros.find((l) => l.id === sessaoAtiva.livroVinculadoId)
    : null

  // Busca as filas (estado React local). Não escreve no store → seguro para
  // ser disparado pelo subscribe sem criar loop.
  const carregarListas = useCallback(async () => {
    const [p, r] = await Promise.all([
      solicitacaoService.listarPendentes(),
      solicitacaoService.listarReservas(),
    ])
    setPendentes(p)
    setReservas(r)
  }, [])

  // Mock: reage a mudanças no store instantaneamente (BroadcastChannel).
  useEffect(() => useBibliotecaStore.subscribe(carregarListas), [carregarListas])

  // Backend: polling traz filas + sessão ativa (aluno está em outro navegador).
  const sincronizar = useCallback(async () => {
    await carregarListas()
    await bibliotecaService.getSessaoAtual() // popula store.sessoes
  }, [carregarListas])
  usePolling(sincronizar, 4000)

  async function confirmarEntrada(solicitacaoId: string) {
    setLoadingId(solicitacaoId)
    try {
      await Tranca.abrir()
      await bibliotecaService.confirmarEntrada(solicitacaoId)
      toast.success('Entrada confirmada! Sessão iniciada.')
    } catch (e: unknown) {
      await Tranca.fechar()
      toast.error(e instanceof Error ? e.message : 'Erro ao confirmar entrada')
    } finally {
      setLoadingId(null)
    }
  }

  async function negarSolicitacao(solicitacaoId: string) {
    setLoadingId(solicitacaoId)
    try {
      await solicitacaoService.atualizarStatus(solicitacaoId, 'negado', 'Negado pelo colaborador')
      toast.info('Solicitação negada')
    } catch {
      toast.error('Erro ao negar solicitação')
    } finally {
      setLoadingId(null)
    }
  }

  async function confirmarSaida(sessaoId: string) {
    setLoadingId(sessaoId)
    try {
      await bibliotecaService.confirmarSaida(sessaoId)
      await Tranca.fechar()
      toast.success('Saída confirmada! Sessão encerrada.')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao confirmar saída')
    } finally {
      setLoadingId(null)
    }
  }

  async function resolverAlerta(id: string) {
    store.resolverAlerta(id)
    toast.success('Alerta resolvido')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="headline-lg">Painel do Colaborador</h1>
        <p className="body-sm text-[var(--muted-foreground)] mt-1">
          Confirme entradas e saídas presencialmente
        </p>
      </div>

      {/* Alertas ativos */}
      {alertasAtivos.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          {alertasAtivos.map((alerta) => (
            <Alert key={alerta.id} variant="warning">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Alerta — {alerta.tipo.replace('_', ' ').toUpperCase()}</AlertTitle>
              <AlertDescription className="flex items-start justify-between gap-4">
                <span>{alerta.descricao}</span>
                <Button size="sm" variant="outline" onClick={() => resolverAlerta(alerta.id)}>
                  Resolver
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Sessão em andamento */}
      {sessaoAtiva && (
        <Card className="mb-6 border-[#9b1b22]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#9b1b22]" />
                Sessão em andamento
              </CardTitle>
              <span className={`px-3 py-1 rounded border label-md ${
                sessaoAtiva.status === 'ativa'
                  ? 'bg-green-50 text-green-700 border-green-300'
                  : 'bg-amber-50 text-amber-700 border-amber-300'
              }`}>
                {sessaoAtiva.status === 'ativa' ? 'EM SESSÃO' : 'AGUARDANDO SAÍDA'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="font-semibold">{alunoNaSessao?.nome}</p>
                <p className="label-md text-[var(--muted-foreground)]">
                  Início: {formatDateTime(sessaoAtiva.inicio)}
                </p>
                <p className="label-md text-[var(--muted-foreground)]">
                  Tempo estimado: {sessaoAtiva.tempoEstimadoMin} min
                </p>
                {livroNaSessao && (
                  <div className="flex items-center gap-2 mt-1">
                    <BookOpen className="w-4 h-4 text-[#9b1b22]" />
                    <p className="text-sm font-medium">{livroNaSessao.titulo}</p>
                  </div>
                )}
              </div>
              {sessaoAtiva.status === 'aguardando_saida' && (
                <Button
                  onClick={() => confirmarSaida(sessaoAtiva.id)}
                  disabled={!!loadingId}
                  size="sm"
                >
                  {loadingId === sessaoAtiva.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Confirmar saída
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Pendentes / Reservas */}
      <Tabs defaultValue="pendentes">
        <TabsList className="w-full">
          <TabsTrigger value="pendentes" className="flex-1 gap-2">
            <Clock className="w-4 h-4" />
            Pendentes
            {pendentes.length > 0 && (
              <span className="ml-1 bg-[#9b1b22] text-white rounded-full text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                {pendentes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reservas" className="flex-1 gap-2">
            <Clock className="w-4 h-4" />
            Reservas
            {reservas.length > 0 && (
              <span className="ml-1 bg-blue-600 text-white rounded-full text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                {reservas.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes">
          {pendentes.length === 0 ? (
            <EmptyState mensagem="Nenhuma solicitação pendente no momento" />
          ) : (
            <div className="flex flex-col gap-3">
              {pendentes.map((sol) => (
                <SolicitacaoCard
                  key={sol.id}
                  sol={sol}
                  onConfirmar={() => confirmarEntrada(sol.id)}
                  onNegar={() => negarSolicitacao(sol.id)}
                  loading={loadingId === sol.id}
                  store={store}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reservas">
          {reservas.length === 0 ? (
            <EmptyState mensagem="Nenhuma reserva agendada" />
          ) : (
            <div className="flex flex-col gap-3">
              {reservas.map((sol) => (
                <SolicitacaoCard
                  key={sol.id}
                  sol={sol}
                  onConfirmar={() => confirmarEntrada(sol.id)}
                  onNegar={() => negarSolicitacao(sol.id)}
                  loading={loadingId === sol.id}
                  store={store}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SolicitacaoCard({
  sol,
  onConfirmar,
  onNegar,
  loading,
  store,
}: {
  sol: SolicitacaoComAluno
  onConfirmar: () => void
  onNegar: () => void
  loading: boolean
  store: BibliotecaState
}) {
  const emprestimoAberto = store.emprestimos.find(
    (e) => e.alunoId === sol.alunoId && e.dataDevolucao === null
  )
  const livroEmprestado = emprestimoAberto
    ? store.livros.find((l) => l.id === emprestimoAberto.livroId)
    : null

  return (
    <Card>
      <CardContent className="py-4 px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            {/* Aluno */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#9b1b22] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {sol.aluno.avatarInicial}
              </div>
              <div>
                <p className="font-semibold text-sm">{sol.aluno.nome}</p>
                <p className="label-md text-[var(--muted-foreground)]">{sol.aluno.id}</p>
              </div>
            </div>

            {/* Tipo e tempo */}
            <div className="flex flex-wrap gap-2 mt-2">
              <StatusChip status={sol.status} />
              <span className="inline-flex items-center rounded border px-2 py-0.5 label-md bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--border)]">
                {sol.tipo === 'agora' ? 'AGORA' : sol.tipo === 'agendada' ? 'AGENDADA' : 'DEVOLUÇÃO'}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                <Clock className="w-3 h-3" /> {sol.tempoEstimadoMin} min
              </span>
            </div>

            {/* Livro pendente */}
            {livroEmprestado && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-700">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Livro pendente: {livroEmprestado.titulo}</span>
              </div>
            )}

            {/* Data agendada */}
            {sol.dataAgendada && (
              <p className="label-md text-[var(--muted-foreground)] mt-1">
                Agendado: {formatDateTime(sol.dataAgendada)}
              </p>
            )}

            <p className="label-md text-[var(--muted-foreground)]">
              Solicitado: {formatDateTime(sol.criadoEm)}
            </p>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Button
              size="sm"
              onClick={onConfirmar}
              disabled={loading}
              className="gap-1.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onNegar}
              disabled={loading}
              className="gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              Negar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ mensagem }: { mensagem: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--secondary)] flex items-center justify-center">
        <CheckCircle2 className="w-6 h-6 text-[var(--muted-foreground)]" />
      </div>
      <p className="body-sm text-[var(--muted-foreground)]">{mensagem}</p>
    </div>
  )
}
