// DTOs serializáveis que espelham o JSON do futuro backend (FastAPI + Supabase).
// Datas sempre como ISO string. Mapeamento DTO ↔ domínio fica nos serviços.

export interface UsuarioDTO {
  id: string
  nome: string
  papel: 'aluno' | 'colaborador' | 'admin'
  cooldown_ate: string | null
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
  cooldown_min: number
  dias_padrao_emprestimo: number
  capacidade_sala: number
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
  cooldown_min?: number
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
