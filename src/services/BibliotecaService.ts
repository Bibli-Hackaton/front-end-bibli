import type { TipoSolicitacao, Solicitacao, Sessao, Emprestimo } from '@/types'

export interface DisponibilidadeResult {
  disponivel: boolean
  motivos: string[]  // lista de bloqueios; vazio se disponível
  capacidadeOk: boolean
  agendaOk: boolean
}

export interface IBibliotecaService {
  // FUTURO BACKEND: GET /api/biblioteca/disponibilidade  → 200 { disponivel, motivos[] }
  verificarDisponibilidade(): Promise<DisponibilidadeResult>

  // FUTURO BACKEND: POST /api/biblioteca/solicitar  body: { tipo, tempoMin, dataAgendada? } → 201 { solicitacao }
  solicitarAcesso(tipo: TipoSolicitacao, tempoMin: number, dataAgendada?: string): Promise<Solicitacao>

  // FUTURO BACKEND: POST /api/biblioteca/confirmar-entrada  body: { solicitacaoId } → 200 { sessao }
  confirmarEntrada(solicitacaoId: string): Promise<Sessao>

  // FUTURO BACKEND: POST /api/biblioteca/sair-sem-livro  body: { sessaoId } → 200 { sessao }
  sairSemLivro(sessaoId: string): Promise<Sessao>

  // FUTURO BACKEND: POST /api/biblioteca/pegar-livro  body: { sessaoId, livroId, dias } → 200 { sessao }
  pegarLivro(sessaoId: string, livroId: string, dias: number): Promise<Sessao>

  // FUTURO BACKEND: POST /api/biblioteca/devolver-livro  body: { sessaoId, livroId } → 200 { sessao }
  devolverLivro(sessaoId: string, livroId: string): Promise<Sessao>

  // FUTURO BACKEND: POST /api/biblioteca/confirmar-saida  body: { sessaoId } → 200 { sessao }
  confirmarSaida(sessaoId: string): Promise<Sessao>

  // FUTURO BACKEND: GET /api/biblioteca/sessao-atual  → 200 { sessao } | 404
  getSessaoAtual(): Promise<Sessao | null>

  // BACKEND: GET /api/loans/my → empréstimo ativo do aluno (returnedAt null) | null
  getEmprestimoAtivo(): Promise<Emprestimo | null>
}
