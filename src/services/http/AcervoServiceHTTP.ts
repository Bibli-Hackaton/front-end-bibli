import { apiClient, ApiError } from './apiClient'
import type { IAcervoService, CriarLivroDados } from '../AcervoService'
import type { Livro } from '@/types'
import type { BookDTO } from '@/types/dto'

export function mapBook(dto: BookDTO): Livro {
  return {
    id: dto.id,
    titulo: dto.title,
    autor: dto.author,
    tagRfid: dto.rfidTag,
    disponivel: dto.isAvailable,
    localizacao: dto.location,
    isbn: dto.isbn ?? undefined,
  }
}

// Domínio → body do backend (camelCase). Só inclui campos presentes para
// respeitar o forbidNonWhitelisted; ISBN vazio é omitido.
function toBookBody(dados: Partial<CriarLivroDados>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (dados.titulo !== undefined) body.title = dados.titulo
  if (dados.autor !== undefined) body.author = dados.autor
  if (dados.tagRfid !== undefined) body.rfidTag = dados.tagRfid
  if (dados.localizacao !== undefined) body.location = dados.localizacao
  if (dados.isbn) body.isbn = dados.isbn
  return body
}

export class AcervoServiceHTTP implements IAcervoService {
  async listarLivros(): Promise<Livro[]> {
    const dtos = await apiClient.get<BookDTO[]>('/api/books')
    return dtos.map(mapBook)
  }

  async getLivro(id: string): Promise<Livro | null> {
    try {
      return mapBook(await apiClient.get<BookDTO>(`/api/books/${id}`))
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    }
  }

  async criarLivro(dados: CriarLivroDados): Promise<Livro> {
    const dto = await apiClient.post<BookDTO>('/api/books', toBookBody(dados), true)
    return mapBook(dto)
  }

  async atualizarLivro(id: string, dados: Partial<CriarLivroDados>): Promise<Livro> {
    const dto = await apiClient.patch<BookDTO>(`/api/books/${id}`, toBookBody(dados))
    return mapBook(dto)
  }

  async removerLivro(id: string): Promise<void> {
    await apiClient.del<void>(`/api/books/${id}`)
  }

  // Backend não tem filtro ?disponivel — filtra no cliente.
  async listarLivrosDisponiveis(): Promise<Livro[]> {
    const livros = await this.listarLivros()
    return livros.filter((l) => l.disponivel)
  }

  async getLivroPorRfid(tagRfid: string): Promise<Livro | null> {
    try {
      return mapBook(await apiClient.get<BookDTO>(`/api/books/rfid/${tagRfid}`))
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    }
  }
}
