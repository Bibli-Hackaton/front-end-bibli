// Mapeamentos DTO (backend, camelCase/inglês) ↔ domínio (pt).
// Compartilhado por SolicitacaoServiceHTTP e BibliotecaServiceHTTP.

import { iniciaisDoNome } from '@/lib/utils'
import type {
  Usuario,
  Solicitacao,
  Sessao,
  Emprestimo,
  TipoSolicitacao,
  StatusSolicitacao,
  StatusSessao,
} from '@/types'
import type { AccessRequestDTO, SessionDTO, LoanDTO, AuthUserDTO } from '@/types/dto'

// ─── Enums ───────────────────────────────────────────────────────────────────

const TIPO_IN: Record<string, TipoSolicitacao> = {
  now: 'agora',
  scheduled: 'agendada',
  return: 'devolucao',
}
const TIPO_OUT: Record<TipoSolicitacao, 'now' | 'scheduled' | 'return'> = {
  agora: 'now',
  agendada: 'scheduled',
  devolucao: 'return',
}
const STATUS_SOL_IN: Record<string, StatusSolicitacao> = {
  pending: 'pendente',
  reserved: 'reservado',
  approved: 'aprovado',
  denied: 'negado',
  expired: 'expirado',
}
const STATUS_SESS_IN: Record<string, StatusSessao> = {
  active: 'ativa',
  awaiting_exit: 'aguardando_saida',
  closed: 'encerrada',
}

export const tipoParaBackend = (t: TipoSolicitacao) => TIPO_OUT[t]

// ─── DTO → domínio ───────────────────────────────────────────────────────────

export function mapUsuario(dto: AuthUserDTO): Usuario {
  return {
    id: dto.id,
    nome: dto.name,
    papel: dto.role,
    avatarInicial: iniciaisDoNome(dto.name),
    email: dto.email,
  }
}

export function mapSolicitacao(dto: AccessRequestDTO): Solicitacao {
  return {
    id: dto.id,
    tipo: TIPO_IN[dto.type],
    alunoId: dto.userId,
    tempoEstimadoMin: dto.estimatedMinutes,
    dataAgendada: dto.scheduledAt,
    status: STATUS_SOL_IN[dto.status],
    criadoEm: dto.createdAt,
    motivoNegacao: dto.denialReason ?? undefined,
  }
}

export function mapSessao(dto: SessionDTO): Sessao {
  return {
    id: dto.id,
    alunoId: dto.userId,
    solicitacaoId: dto.requestId,
    inicio: dto.startedAt,
    tempoEstimadoMin: dto.estimatedMinutes,
    status: STATUS_SESS_IN[dto.status],
    livroVinculadoId: dto.linkedBookId,
  }
}

export function mapEmprestimo(dto: LoanDTO): Emprestimo {
  return {
    id: dto.id,
    alunoId: dto.userId,
    livroId: dto.bookId,
    dataEmprestimo: dto.loanedAt,
    diasParaDevolver: dto.daysRequested,
    dataPrevista: dto.dueDate,
    dataDevolucao: dto.returnedAt,
    alunoNome: dto.user?.name,
    livroTitulo: dto.book?.title,
  }
}
