import { useBibliotecaStore } from '@/store/bibliotecaStore'
import { generateId } from '@/lib/utils'
import type { IAcervoService, CriarLivroDados } from '../AcervoService'
import type { Livro } from '@/types'

export class AcervoServiceMock implements IAcervoService {
  async listarLivros(): Promise<Livro[]> {
    return useBibliotecaStore.getState().livros
  }

  async getLivro(id: string): Promise<Livro | null> {
    return useBibliotecaStore.getState().livros.find((l) => l.id === id) ?? null
  }

  async criarLivro(dados: CriarLivroDados): Promise<Livro> {
    const livro: Livro = {
      id: generateId('livro'),
      ...dados,
      disponivel: true,
    }
    useBibliotecaStore.getState().upsertLivro(livro)
    return livro
  }

  async atualizarLivro(id: string, dados: Partial<CriarLivroDados>): Promise<Livro> {
    const store = useBibliotecaStore.getState()
    const livro = store.livros.find((l) => l.id === id)
    if (!livro) throw new Error('Livro não encontrado')
    const atualizado = { ...livro, ...dados }
    store.upsertLivro(atualizado)
    return atualizado
  }

  async removerLivro(id: string): Promise<void> {
    useBibliotecaStore.getState().removeLivro(id)
  }

  async listarLivrosDisponiveis(): Promise<Livro[]> {
    return useBibliotecaStore.getState().livros.filter((l) => l.disponivel)
  }

  async getLivroPorRfid(tagRfid: string): Promise<Livro | null> {
    return useBibliotecaStore.getState().livros.find((l) => l.tagRfid === tagRfid) ?? null
  }
}
