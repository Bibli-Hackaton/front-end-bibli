import type { Config, Alerta, Emprestimo, Livro } from '@/types'

export interface InventarioStats {
  totalLivros: number
  livrosDisponiveis: number
  livrosEmprestados: number
  emprestimosAtrasados: number
  alertasAtivos: number
}

export interface IAdminService {
  // BACKEND: GET /api/config  (auth) → 200 { data: LibraryConfigDTO }
  getConfig(): Promise<Config>

  // BACKEND: PATCH /api/config  (admin) body: { maxSessionMinutes?, maxLoanDays?, roomCapacity? } → 200 { data: LibraryConfigDTO }
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
