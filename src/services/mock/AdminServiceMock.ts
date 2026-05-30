import { useBibliotecaStore } from '@/store/bibliotecaStore'
import type { IAdminService, InventarioStats } from '../AdminService'
import type { Config, Alerta, Emprestimo, Livro } from '@/types'

export class AdminServiceMock implements IAdminService {
  async getConfig(): Promise<Config> {
    return useBibliotecaStore.getState().config
  }

  async salvarConfig(dados: Partial<Config>): Promise<Config> {
    useBibliotecaStore.getState().patchConfig(dados)
    return useBibliotecaStore.getState().config
  }

  async getInventario(): Promise<InventarioStats> {
    const store = useBibliotecaStore.getState()
    const agora = new Date()
    const totalLivros = store.livros.length
    const livrosDisponiveis = store.livros.filter((l) => l.disponivel).length
    const livrosEmprestados = totalLivros - livrosDisponiveis
    const emprestimosAtrasados = store.emprestimos.filter(
      (e) => e.dataDevolucao === null && new Date(e.dataPrevista) < agora
    ).length
    const alertasAtivos = store.alertas.filter((a) => !a.resolvido).length

    return { totalLivros, livrosDisponiveis, livrosEmprestados, emprestimosAtrasados, alertasAtivos }
  }

  async getAlertas(): Promise<Alerta[]> {
    return useBibliotecaStore
      .getState()
      .alertas.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
  }

  async resolverAlerta(id: string): Promise<void> {
    useBibliotecaStore.getState().resolverAlerta(id)
  }

  async listarEmprestimos(): Promise<Emprestimo[]> {
    return useBibliotecaStore
      .getState()
      .emprestimos.sort(
        (a, b) => new Date(b.dataEmprestimo).getTime() - new Date(a.dataEmprestimo).getTime()
      )
  }

  async listarLivrosEmprestados(): Promise<Livro[]> {
    const store = useBibliotecaStore.getState()
    const livrosEmprestados = store.emprestimos
      .filter((e) => e.dataDevolucao === null)
      .map((e) => e.livroId)
    return store.livros.filter((l) => livrosEmprestados.includes(l.id))
  }
}
