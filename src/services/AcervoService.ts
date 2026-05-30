import type { Livro } from '@/types'

export interface CriarLivroDados {
  titulo: string
  autor: string
  tagRfid: string
  localizacao: string
  isbn?: string
}

export interface IAcervoService {
  // FUTURO BACKEND: GET /api/acervo/livros  → 200 { livros[] }
  listarLivros(): Promise<Livro[]>

  // FUTURO BACKEND: GET /api/acervo/livros/:id  → 200 { livro } | 404
  getLivro(id: string): Promise<Livro | null>

  // FUTURO BACKEND: POST /api/acervo/livros  body: CriarLivroBody → 201 { livro }
  criarLivro(dados: CriarLivroDados): Promise<Livro>

  // FUTURO BACKEND: PATCH /api/acervo/livros/:id  body: AtualizarLivroBody → 200 { livro }
  atualizarLivro(id: string, dados: Partial<CriarLivroDados>): Promise<Livro>

  // FUTURO BACKEND: DELETE /api/acervo/livros/:id  → 204
  removerLivro(id: string): Promise<void>

  // FUTURO BACKEND: GET /api/acervo/livros?disponivel=true  → 200 { livros[] }
  listarLivrosDisponiveis(): Promise<Livro[]>

  // FUTURO BACKEND: GET /api/acervo/livros?rfid=<tag>  → 200 { livro } | 404
  getLivroPorRfid(tagRfid: string): Promise<Livro | null>
}
