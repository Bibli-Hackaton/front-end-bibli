// ─── Domínio ───────────────────────────────────────────────────────────────

export type Papel = 'aluno' | 'colaborador' | 'admin'

export interface Usuario {
  id: string
  nome: string
  papel: Papel
  avatarInicial: string       // ex.: 'AS' para Ana Silva
  email?: string              // presente quando vindo do backend real
}

export interface Livro {
  id: string
  titulo: string
  autor: string
  tagRfid: string
  disponivel: boolean
  localizacao: string   // ex.: 'Estante A2'
  isbn?: string
}

export interface Emprestimo {
  id: string
  alunoId: string
  livroId: string
  dataEmprestimo: string       // ISO
  diasParaDevolver: number
  dataPrevista: string         // ISO (dataEmprestimo + dias)
  dataDevolucao: string | null // ISO quando devolvido; null = aberto
  // Preenchidos pelas listagens do backend (relations user/book). No modo mock
  // ficam undefined e a UI resolve nome/título pelo store.
  alunoNome?: string
  livroTitulo?: string
}

export type TipoSolicitacao = 'agora' | 'agendada' | 'devolucao'
export type StatusSolicitacao = 'pendente' | 'reservado' | 'aprovado' | 'negado' | 'expirado'

export interface Solicitacao {
  id: string
  tipo: TipoSolicitacao
  alunoId: string
  tempoEstimadoMin: number
  dataAgendada: string | null  // ISO para tipo 'agendada'; null para 'agora'/'devolucao'
  status: StatusSolicitacao
  criadoEm: string             // ISO
  motivoNegacao?: string
}

export type StatusSessao = 'ativa' | 'aguardando_saida' | 'encerrada'

export interface Sessao {
  id: string
  alunoId: string
  solicitacaoId: string
  inicio: string               // ISO
  tempoEstimadoMin: number
  status: StatusSessao
  livroVinculadoId: string | null  // null se só leu na sala
}

export type TipoAlerta = 'webcam_falhou' | 'sessao_encerrada_sem_registro' | 'tempo_excedido'

export interface Alerta {
  id: string
  tipo: TipoAlerta
  descricao: string
  criadoEm: string             // ISO
  resolvido: boolean
  sessaoId?: string
  alunoId?: string
}

export interface Config {
  tempoMaxSessaoMin: number
  diasPadraoEmprestimo: number
  capacidadeSala: number       // default: 1
}

// ─── Estado UI (Zustand direto, sem passar pela camada de serviço) ──────────

export interface UIState {
  usuarioLogadoId: string | null
  sessaoAtivaId: string | null
}
