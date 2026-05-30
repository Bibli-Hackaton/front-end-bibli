import { apiClient } from './apiClient'
import { mapEmprestimo } from './mappers'
import { mapBook } from './AcervoServiceHTTP'
import { AdminServiceMock } from '../mock/AdminServiceMock'
import type { IAdminService, InventarioStats } from '../AdminService'
import type { Config, Alerta, Emprestimo, Livro } from '@/types'
import type { LibraryConfigDTO, LoanDTO, BookDTO } from '@/types/dto'

function mapConfig(dto: LibraryConfigDTO): Config {
  return {
    tempoMaxSessaoMin: dto.maxSessionMinutes,
    diasPadraoEmprestimo: dto.maxLoanDays,
    capacidadeSala: dto.roomCapacity,
  }
}

// Domínio → body do backend (camelCase). Só inclui campos presentes
// (forbidNonWhitelisted) e arredonda para inteiro (DTO usa @IsInt).
function toConfigBody(dados: Partial<Config>): Record<string, number> {
  const body: Record<string, number> = {}
  if (dados.tempoMaxSessaoMin !== undefined) body.maxSessionMinutes = Math.round(dados.tempoMaxSessaoMin)
  if (dados.diasPadraoEmprestimo !== undefined) body.maxLoanDays = Math.round(dados.diasPadraoEmprestimo)
  if (dados.capacidadeSala !== undefined) body.roomCapacity = Math.round(dados.capacidadeSala)
  return body
}

export class AdminServiceHTTP implements IAdminService {
  // Alertas ainda não têm controller no backend → delegam ao mock.
  private fallback = new AdminServiceMock()

  async getConfig(): Promise<Config> {
    return mapConfig(await apiClient.get<LibraryConfigDTO>('/api/config'))
  }

  async salvarConfig(dados: Partial<Config>): Promise<Config> {
    const dto = await apiClient.patch<LibraryConfigDTO>('/api/config', toConfigBody(dados))
    return mapConfig(dto)
  }

  async getInventario(): Promise<InventarioStats> {
    const [books, loans] = await Promise.all([
      apiClient.get<BookDTO[]>('/api/books'),
      apiClient.get<LoanDTO[]>('/api/loans'),
    ])
    const agora = new Date()
    const totalLivros = books.length
    const livrosDisponiveis = books.filter((b) => b.isAvailable).length
    const livrosEmprestados = totalLivros - livrosDisponiveis
    const emprestimosAtrasados = loans.filter(
      (l) => l.returnedAt === null && new Date(l.dueDate) < agora
    ).length
    const alertasAtivos = (await this.fallback.getAlertas()).filter((a) => !a.resolvido).length

    return { totalLivros, livrosDisponiveis, livrosEmprestados, emprestimosAtrasados, alertasAtivos }
  }

  async listarEmprestimos(): Promise<Emprestimo[]> {
    const dtos = await apiClient.get<LoanDTO[]>('/api/loans')
    return dtos.map(mapEmprestimo)
  }

  async listarLivrosEmprestados(): Promise<Livro[]> {
    const books = await apiClient.get<BookDTO[]>('/api/books')
    return books.filter((b) => !b.isAvailable).map(mapBook)
  }

  // ── Pendentes de backend → mock ──
  getAlertas(): Promise<Alerta[]> {
    return this.fallback.getAlertas()
  }
  resolverAlerta(id: string): Promise<void> {
    return this.fallback.resolverAlerta(id)
  }
}
