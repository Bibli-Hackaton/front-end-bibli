import { useState, useEffect } from 'react'
import { BookOpen, BookX, AlertTriangle, CheckCircle2, Loader2, BarChart3 } from 'lucide-react'
import { adminService } from '@/services'
import { useBibliotecaStore } from '@/store/bibliotecaStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { InventarioStats } from '@/services/AdminService'
import type { Alerta, Emprestimo } from '@/types'

export function AdminInventario() {
  const store = useBibliotecaStore()
  const [stats, setStats] = useState<InventarioStats | null>(null)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([])
  const [loading, setLoading] = useState(true)

  async function carregar() {
    const [s, a, e] = await Promise.all([
      adminService.getInventario(),
      adminService.getAlertas(),
      adminService.listarEmprestimos(),
    ])
    setStats(s)
    setAlertas(a)
    setEmprestimos(e)
    setLoading(false)
  }

  useEffect(() => {
    carregar()
    const unsubscribe = useBibliotecaStore.subscribe(carregar)
    return unsubscribe
  }, [])

  async function resolverAlerta(id: string) {
    await adminService.resolverAlerta(id)
    toast.success('Alerta resolvido')
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#9b1b22]" />
      </div>
    )
  }

  const alertasAtivos = alertas.filter((a) => !a.resolvido)
  const alertasResolvidos = alertas.filter((a) => a.resolvido)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-[#fef2f2] flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-[#9b1b22]" />
        </div>
        <div>
          <h1 className="headline-lg">Inventário</h1>
          <p className="body-sm text-[var(--muted-foreground)]">Métricas e inconsistências do acervo</p>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <MetricCard
          titulo="Total"
          valor={stats.totalLivros}
          icone={<BookOpen className="w-5 h-5 text-[#9b1b22]" />}
          cor="#fef2f2"
        />
        <MetricCard
          titulo="Disponíveis"
          valor={stats.livrosDisponiveis}
          icone={<CheckCircle2 className="w-5 h-5 text-green-600" />}
          cor="#f0fdf4"
        />
        <MetricCard
          titulo="Emprestados"
          valor={stats.livrosEmprestados}
          icone={<BookX className="w-5 h-5 text-amber-600" />}
          cor="#fffbeb"
        />
        <MetricCard
          titulo="Alertas"
          valor={stats.alertasAtivos}
          icone={<AlertTriangle className="w-5 h-5 text-[#9b1b22]" />}
          cor={stats.alertasAtivos > 0 ? '#fef2f2' : '#f3f4f6'}
          destaque={stats.alertasAtivos > 0}
        />
      </div>

      {/* Alertas ativos */}
      {alertasAtivos.length > 0 && (
        <div className="mb-8">
          <h2 className="headline-md mb-4">
            Alertas ativos
            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#9b1b22] text-white text-xs font-bold">
              {alertasAtivos.length}
            </span>
          </h2>
          <div className="flex flex-col gap-3">
            {alertasAtivos.map((alerta) => (
              <Alert key={alerta.id} variant="warning">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>{alerta.tipo.replace(/_/g, ' ').toUpperCase()}</AlertTitle>
                <AlertDescription className="flex items-start justify-between gap-4">
                  <div>
                    <p>{alerta.descricao}</p>
                    <p className="label-md text-[var(--muted-foreground)] mt-1">
                      {formatDateTime(alerta.criadoEm)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => resolverAlerta(alerta.id)}>
                    Resolver
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Empréstimos em aberto */}
      <div className="mb-8">
        <h2 className="headline-md mb-4">Empréstimos em aberto</h2>
        {emprestimos.filter((e) => e.dataDevolucao === null).length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="body-sm text-[var(--muted-foreground)]">Nenhum empréstimo em aberto</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {emprestimos
              .filter((e) => e.dataDevolucao === null)
              .map((emp) => {
                const aluno = store.usuarios.find((u) => u.id === emp.alunoId)
                const livro = store.livros.find((l) => l.id === emp.livroId)
                const atrasado = new Date(emp.dataPrevista) < new Date()
                return (
                  <Card key={emp.id} className={atrasado ? 'border-[#9b1b22]' : ''}>
                    <CardContent className="py-4 px-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold text-sm">{livro?.titulo ?? 'Livro não encontrado'}</p>
                          <p className="body-sm text-[var(--muted-foreground)]">{aluno?.nome}</p>
                          <p className="label-md text-[var(--muted-foreground)]">
                            Emprestado: {formatDate(emp.dataEmprestimo)} •
                            Devolução: {formatDate(emp.dataPrevista)}
                          </p>
                        </div>
                        {atrasado && (
                          <span className="px-2 py-0.5 rounded border label-md bg-red-50 text-[#9b1b22] border-red-300 flex-shrink-0">
                            ATRASADO
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        )}
      </div>

      {/* Histórico de alertas resolvidos */}
      {alertasResolvidos.length > 0 && (
        <div>
          <h2 className="headline-md mb-4 text-[var(--muted-foreground)]">Alertas resolvidos</h2>
          <div className="flex flex-col gap-2">
            {alertasResolvidos.map((alerta) => (
              <div
                key={alerta.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] opacity-70"
              >
                <div>
                  <p className="label-md text-[var(--muted-foreground)]">
                    {alerta.tipo.replace(/_/g, ' ').toUpperCase()}
                  </p>
                  <p className="body-sm text-[var(--muted-foreground)]">{alerta.descricao}</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  titulo,
  valor,
  icone,
  cor,
  destaque = false,
}: {
  titulo: string
  valor: number
  icone: React.ReactNode
  cor: string
  destaque?: boolean
}) {
  return (
    <Card className={destaque ? 'border-[#9b1b22]' : ''}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: cor }}>
          {icone}
        </div>
        <p className="label-md text-[var(--muted-foreground)]">{titulo}</p>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <p className={`text-3xl font-bold ${destaque ? 'text-[#9b1b22]' : 'text-[var(--foreground)]'}`}>
          {valor}
        </p>
      </CardContent>
    </Card>
  )
}
