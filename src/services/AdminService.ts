import type { Config, Alerta, Emprestimo, Livro } from '@/types'

export interface InventarioStats {
  totalLivros: number
  livrosDisponiveis: number
  livrosEmprestados: number
  emprestimosAtrasados: number
  alertasAtivos: number
}

export interface IAdminService {
  // FUTURO BACKEND: GET /api/admin/config  → 200 { config }
  getConfig(): Promise<Config>

  // FUTURO BACKEND: PATCH /api/admin/config  body: SalvarConfigBody → 200 { config }
  salvarConfig(dados: Partial<Config>): Promise<Config>

  // FUTURO BACKEND: GET /api/admin/inventario  → 200 { stats }
  getInventario(): Promise<InventarioStats>

  // FUTURO BACKEND: GET /api/admin/alertas  → 200 { alertas[] }
  getAlertas(): Promise<Alerta[]>

  // FUTURO BACKEND: PATCH /api/admin/alertas/:id/resolver  → 200 { alerta }
  resolverAlerta(id: string): Promise<void>

  // FUTURO BACKEND: GET /api/admin/emprestimos  → 200 { emprestimos[] }
  listarEmprestimos(): Promise<Emprestimo[]>

  // FUTURO BACKEND: GET /api/admin/livros-emprestados  → 200 { livros[] }
  listarLivrosEmprestados(): Promise<Livro[]>
}
