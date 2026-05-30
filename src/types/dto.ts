// DTOs serializáveis que espelham o JSON do futuro backend (FastAPI + Supabase).
// Datas sempre como ISO string. Mapeamento DTO ↔ domínio fica nos serviços.

export interface UsuarioDTO {
  id: string
  nome: string
  papel: 'aluno' | 'colaborador' | 'admin'
}

// ─── Auth (backend NestJS real — camelCase, dentro de { data }) ──────────────

export interface AuthUserDTO {
  id: string
  name: string
  email: string
  role: 'aluno' | 'colaborador' | 'admin'
  createdAt: string
}

export interface LoginResponseDTO {
  accessToken: string
  user: AuthUserDTO
}

// ─── Requests / Sessions / Loans (backend real, camelCase) ───────────────────

export interface AccessRequestDTO {
  id: string
  userId: string
  type: 'now' | 'scheduled' | 'return'
  estimatedMinutes: number
  scheduledAt: string | null
  status: 'pending' | 'reserved' | 'approved' | 'denied' | 'expired'
  denialReason: string | null
  createdAt: string
  user?: AuthUserDTO // presente nas listagens (relation), pode vir com campos extras
}

export interface SessionDTO {
  id: string
  userId: string
  requestId: string
  startedAt: string
  estimatedMinutes: number
  status: 'active' | 'awaiting_exit' | 'closed'
  linkedBookId: string | null
  closedAt: string | null
}

export interface LoanDTO {
  id: string
  userId: string
  bookId: string
  sessionId: string
  loanedAt: string
  dueDate: string
  returnedAt: string | null
  daysRequested: number
  user?: AuthUserDTO // presente nas listagens (relation)
  book?: BookDTO // presente nas listagens (relation)
}

export interface LivroDTO {
  id: string
  titulo: string
  autor: string
  tag_rfid: string
  disponivel: boolean
  localizacao: string
  isbn?: string
}

// Livro como retornado pelo backend real (camelCase, entity TypeORM 'books').
export interface BookDTO {
  id: string
  title: string
  author: string
  isbn: string | null
  rfidTag: string
  location: string
  isAvailable: boolean
  createdAt: string
}

export interface EmprestimoDTO {
  id: string
  aluno_id: string
  livro_id: string
  data_emprestimo: string
  dias_para_devolver: number
  data_prevista: string
  data_devolucao: string | null
}

export interface SolicitacaoDTO {
  id: string
  tipo: 'agora' | 'agendada' | 'devolucao'
  aluno_id: string
  tempo_estimado_min: number
  data_agendada: string | null
  status: 'pendente' | 'reservado' | 'aprovado' | 'negado' | 'expirado'
  criado_em: string
  motivo_negacao?: string
}

export interface SessaoDTO {
  id: string
  aluno_id: string
  solicitacao_id: string
  inicio: string
  tempo_estimado_min: number
  status: 'ativa' | 'aguardando_saida' | 'encerrada'
  livro_vinculado_id: string | null
}

export interface AlertaDTO {
  id: string
  tipo: string
  descricao: string
  criado_em: string
  resolvido: boolean
  sessao_id?: string
  aluno_id?: string
}

export interface ConfigDTO {
  tempo_max_sessao_min: number
  dias_padrao_emprestimo: number
  capacidade_sala: number
}

// Config como retornada pelo backend real (camelCase, entity 'library_config').
export interface LibraryConfigDTO {
  id: string
  maxSessionMinutes: number
  maxLoanDays: number
  roomCapacity: number
  updatedAt: string
  updatedBy: string | null
}

// ─── Request bodies (para comentários de endpoint) ──────────────────────────

export interface SolicitarAcessoBody {
  tipo: 'agora' | 'agendada' | 'devolucao'
  tempo_min: number
  data_agendada?: string
}

export interface ConfirmarEntradaBody {
  solicitacao_id: string
}

export interface PegarLivroBody {
  livro_id: string
  dias: number
}

export interface SalvarConfigBody {
  tempo_max_sessao_min?: number
  dias_padrao_emprestimo?: number
  capacidade_sala?: number
}

export interface CriarLivroBody {
  titulo: string
  autor: string
  tag_rfid: string
  localizacao: string
  isbn?: string
}

export interface AtualizarLivroBody extends Partial<CriarLivroBody> {}
