import { useBibliotecaStore } from '@/store/bibliotecaStore'
import { apiClient } from './apiClient'
import { mapSolicitacao, mapSessao, mapEmprestimo, tipoParaBackend } from './mappers'
import type { IBibliotecaService, DisponibilidadeResult } from '../BibliotecaService'
import type { TipoSolicitacao, Solicitacao, Sessao, Emprestimo } from '@/types'
import type { AccessRequestDTO, SessionDTO, BookDTO, LoanDTO } from '@/types/dto'

export class BibliotecaServiceHTTP implements IBibliotecaService {
  // Escreve a sessão atual no store (capacidade=1 → no máx. uma ativa).
  private syncSessao(dto: SessionDTO | null): Sessao | null {
    const store = useBibliotecaStore.getState()
    if (!dto) {
      useBibliotecaStore.setState({ sessoes: [] })
      if (store.ui.sessaoAtivaId) store.setSessaoAtiva(null)
      return null
    }
    const sessao = mapSessao(dto)
    useBibliotecaStore.setState({ sessoes: [sessao] })
    if (sessao.alunoId === store.ui.usuarioLogadoId) store.setSessaoAtiva(sessao.id)
    return sessao
  }

  // Resolve a tag RFID de um livro (store primeiro, senão busca no backend).
  private async resolverTag(livroId: string): Promise<string> {
    const local = useBibliotecaStore.getState().livros.find((l) => l.id === livroId)
    if (local) return local.tagRfid
    const dto = await apiClient.get<BookDTO>(`/api/books/${livroId}`)
    return dto.rfidTag
  }

  async verificarDisponibilidade(): Promise<DisponibilidadeResult> {
    const sessaoAtual = await apiClient.get<SessionDTO | null>('/api/sessions/current')

    const motivos: string[] = []

    // RN2 — capacidade (sessão ativa global ⇒ sala ocupada)
    const capacidadeOk = !sessaoAtual
    if (!capacidadeOk) motivos.push('Sala ocupada no momento')

    // RN5 — conflito de agenda é validado pelo backend no create
    return { disponivel: motivos.length === 0, motivos, capacidadeOk, agendaOk: true }
  }

  async solicitarAcesso(
    tipo: TipoSolicitacao,
    tempoMin: number,
    dataAgendada?: string,
  ): Promise<Solicitacao> {
    const body: Record<string, unknown> = {
      type: tipoParaBackend(tipo),
      estimated_minutes: tempoMin,
    }
    if (dataAgendada) body.scheduled_at = new Date(dataAgendada).toISOString()

    const dto = await apiClient.post<AccessRequestDTO>('/api/requests', body, true)
    const sol = mapSolicitacao(dto)
    useBibliotecaStore.getState().addSolicitacao(sol)
    return sol
  }

  async confirmarEntrada(solicitacaoId: string): Promise<Sessao> {
    // approve aprova a solicitação E cria a sessão (no backend).
    await apiClient.patch<AccessRequestDTO>(`/api/requests/${solicitacaoId}/approve`)
    useBibliotecaStore.getState().updateSolicitacao(solicitacaoId, { status: 'aprovado' })
    // Busca a sessão recém-criada (capacidade=1 → /current é a dela).
    const dto = await apiClient.get<SessionDTO | null>('/api/sessions/current')
    const sessao = this.syncSessao(dto)
    if (!sessao) throw new Error('Sessão não encontrada após confirmar entrada')
    return sessao
  }

  async sairSemLivro(sessaoId: string): Promise<Sessao> {
    const dto = await apiClient.post<SessionDTO>(`/api/sessions/${sessaoId}/request-exit`, undefined, true)
    return this.syncSessao(dto)!
  }

  async pegarLivro(sessaoId: string, livroId: string, dias: number): Promise<Sessao> {
    const rfid_tag = await this.resolverTag(livroId)
    await apiClient.post<SessionDTO>(
      `/api/sessions/${sessaoId}/take-book`,
      { rfid_tag, days_requested: dias },
      true,
    )
    // Pegar o livro encerra a permanência → encaminha para a saída
    // (no backend take-book mantém a sessão 'active'; request-exit muda
    // para 'awaiting_exit', habilitando a confirmação do colaborador).
    return this.sairSemLivro(sessaoId)
  }

  async devolverLivro(sessaoId: string, livroId: string): Promise<Sessao> {
    const rfid_tag = await this.resolverTag(livroId)
    await apiClient.post<SessionDTO>(
      `/api/sessions/${sessaoId}/return-book`,
      { rfid_tag },
      true,
    )
    // Devolver também encaminha o aluno para a saída.
    return this.sairSemLivro(sessaoId)
  }

  async confirmarSaida(sessaoId: string): Promise<Sessao> {
    const dto = await apiClient.post<SessionDTO>(`/api/sessions/${sessaoId}/confirm-exit`, undefined, true)
    const sessao = mapSessao(dto)
    // Sessão encerrada → limpa a sessão atual do store.
    this.syncSessao(null)
    return sessao
  }

  async getSessaoAtual(): Promise<Sessao | null> {
    const dto = await apiClient.get<SessionDTO | null>('/api/sessions/current')
    return this.syncSessao(dto)
  }

  async getEmprestimoAtivo(): Promise<Emprestimo | null> {
    const dtos = await apiClient.get<LoanDTO[]>('/api/loans/my')
    const ativo = dtos.find((l) => l.returnedAt === null) ?? null
    const emp = ativo ? mapEmprestimo(ativo) : null
    useBibliotecaStore.setState({ emprestimos: emp ? [emp] : [] })
    return emp
  }
}
