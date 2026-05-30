import { useBibliotecaStore } from '@/store/bibliotecaStore'
import { apiClient } from './apiClient'
import { mapSolicitacao, mapUsuario } from './mappers'
import type { ISolicitacaoService, SolicitacaoComAluno } from '../SolicitacaoService'
import type { Solicitacao, Usuario } from '@/types'
import type { AccessRequestDTO } from '@/types/dto'

function usuarioDaRequest(dto: AccessRequestDTO): Usuario {
  if (dto.user) return mapUsuario(dto.user)
  // Fallback se a relation não vier: usuário mínimo só com id.
  return { id: dto.userId, nome: dto.userId, papel: 'aluno', avatarInicial: '?' }
}

export class SolicitacaoServiceHTTP implements ISolicitacaoService {
  private mapComAluno(dtos: AccessRequestDTO[]): SolicitacaoComAluno[] {
    const store = useBibliotecaStore.getState()
    return dtos.map((dto) => {
      const aluno = usuarioDaRequest(dto)
      store.upsertUsuario(aluno) // mantém o store coerente p/ outras leituras
      return { ...mapSolicitacao(dto), aluno }
    })
  }

  async listarPendentes(): Promise<SolicitacaoComAluno[]> {
    return this.mapComAluno(await apiClient.get<AccessRequestDTO[]>('/api/requests/pending'))
  }

  async listarReservas(): Promise<SolicitacaoComAluno[]> {
    return this.mapComAluno(await apiClient.get<AccessRequestDTO[]>('/api/requests/reserved'))
  }

  async listarPorAluno(_alunoId: string): Promise<Solicitacao[]> {
    // Backend usa o token (/requests/my), ignora o param.
    const dtos = await apiClient.get<AccessRequestDTO[]>('/api/requests/my')
    return dtos.map(mapSolicitacao)
  }

  async atualizarStatus(
    id: string,
    status: Solicitacao['status'],
    motivo?: string,
  ): Promise<Solicitacao> {
    let dto: AccessRequestDTO
    if (status === 'negado') {
      dto = await apiClient.patch<AccessRequestDTO>(`/api/requests/${id}/deny`, {
        denial_reason: motivo ?? 'Negado pelo colaborador',
      })
    } else if (status === 'aprovado') {
      dto = await apiClient.patch<AccessRequestDTO>(`/api/requests/${id}/approve`)
    } else {
      throw new Error(`Transição de status não suportada: ${status}`)
    }
    const sol = mapSolicitacao(dto)
    useBibliotecaStore.getState().updateSolicitacao(id, sol)
    return sol
  }
}
