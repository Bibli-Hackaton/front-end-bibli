import { useBibliotecaStore } from '@/store/bibliotecaStore'
import type { ISolicitacaoService, SolicitacaoComAluno } from '../SolicitacaoService'
import type { Solicitacao } from '@/types'

export class SolicitacaoServiceMock implements ISolicitacaoService {
  async listarPendentes(): Promise<SolicitacaoComAluno[]> {
    const store = useBibliotecaStore.getState()
    return store.solicitacoes
      .filter((s) => s.status === 'pendente')
      .map((s) => ({
        ...s,
        aluno: store.usuarios.find((u) => u.id === s.alunoId)!,
      }))
      .sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime())
  }

  async listarReservas(): Promise<SolicitacaoComAluno[]> {
    const store = useBibliotecaStore.getState()
    return store.solicitacoes
      .filter((s) => s.status === 'reservado')
      .map((s) => ({
        ...s,
        aluno: store.usuarios.find((u) => u.id === s.alunoId)!,
      }))
      .sort((a, b) => {
        const aDate = a.dataAgendada ? new Date(a.dataAgendada).getTime() : 0
        const bDate = b.dataAgendada ? new Date(b.dataAgendada).getTime() : 0
        return aDate - bDate
      })
  }

  async listarPorAluno(alunoId: string): Promise<Solicitacao[]> {
    return useBibliotecaStore
      .getState()
      .solicitacoes.filter((s) => s.alunoId === alunoId)
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
  }

  async atualizarStatus(
    id: string,
    status: Solicitacao['status'],
    motivo?: string
  ): Promise<Solicitacao> {
    const store = useBibliotecaStore.getState()
    const sol = store.solicitacoes.find((s) => s.id === id)
    if (!sol) throw new Error('Solicitação não encontrada')
    store.updateSolicitacao(id, { status, motivoNegacao: motivo })
    return { ...sol, status, motivoNegacao: motivo }
  }
}
