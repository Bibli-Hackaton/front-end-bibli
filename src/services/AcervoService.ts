import type { Livro } from '@/types'

export interface CriarLivroDados {
  titulo: string
  autor: string
  tagRfid: string
  localizacao: string
  isbn?: string
}

export interface IAcervoService {
  // BACKEND: GET /api/books  (auth) → 200 { data: BookDTO[] }
  listarLivros(): Promise<Livro[]>

  // BACKEND: GET /api/books/:id  (auth) → 200 { data: BookDTO } | 404
  getLivro(id: string): Promise<Livro | null>

  // BACKEND: POST /api/books  (admin) body: { title, author, rfidTag, location, isbn? } → 201 { data: BookDTO }
  criarLivro(dados: CriarLivroDados): Promise<Livro>

  // BACKEND: PATCH /api/books/:id  (admin) body: Partial<…> → 200 { data: BookDTO }
  atualizarLivro(id: string, dados: Partial<CriarLivroDados>): Promise<Livro>

  // BACKEND: DELETE /api/books/:id  (admin) → 200
  removerLivro(id: string): Promise<void>

  // BACKEND: sem filtro server-side — GET /api/books filtrado no cliente
  listarLivrosDisponiveis(): Promise<Livro[]>

  // BACKEND: GET /api/books/rfid/:tag  (auth) → 200 { data: BookDTO } | 404
  getLivroPorRfid(tagRfid: string): Promise<Livro | null>
}
