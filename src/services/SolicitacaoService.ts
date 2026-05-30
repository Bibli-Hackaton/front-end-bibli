import type { Solicitacao, Usuario } from '@/types'

export interface SolicitacaoComAluno extends Solicitacao {
  aluno: Usuario
}

export interface ISolicitacaoService {
  // FUTURO BACKEND: GET /api/solicitacoes?status=pendente  → 200 { solicitacoes[] }
  listarPendentes(): Promise<SolicitacaoComAluno[]>

  // FUTURO BACKEND: GET /api/solicitacoes?status=reservado  → 200 { solicitacoes[] }
  listarReservas(): Promise<SolicitacaoComAluno[]>

  // FUTURO BACKEND: GET /api/solicitacoes?alunoId=<id>&status=aprovado  → 200 { solicitacoes[] }
  listarPorAluno(alunoId: string): Promise<Solicitacao[]>

  // FUTURO BACKEND: PATCH /api/solicitacoes/:id  body: { status, motivoNegacao? } → 200 { solicitacao }
  atualizarStatus(id: string, status: Solicitacao['status'], motivo?: string): Promise<Solicitacao>
}
