import { useBibliotecaStore } from '@/store/bibliotecaStore'
import { generateId, addMinutes } from '@/lib/utils'
import type { IBibliotecaService, DisponibilidadeResult } from '../BibliotecaService'
import type { TipoSolicitacao, Solicitacao, Sessao, Emprestimo } from '@/types'

export class BibliotecaServiceMock implements IBibliotecaService {
  async verificarDisponibilidade(): Promise<DisponibilidadeResult> {
    const store = useBibliotecaStore.getState()
    const { usuarioLogadoId } = store.ui
    if (!usuarioLogadoId) throw new Error('Não autenticado')

    const config = store.config
    const motivos: string[] = []

    // RN2 — Capacidade: máx 1 pessoa na sala
    const sessaoAtiva = store.sessoes.find(
      (s) => s.status === 'ativa' || s.status === 'aguardando_saida'
    )
    const capacidadeOk = !sessaoAtiva
    if (!capacidadeOk) {
      motivos.push(`Sala ocupada (capacidade máx: ${config.capacidadeSala} pessoa)`)
    }

    // RN5 — Sem conflito de agenda: verificar reservas nas próximas 2 horas
    const agora = new Date()
    const limite = addMinutes(agora, config.tempoMaxSessaoMin)
    const conflito = store.solicitacoes.find(
      (s) =>
        s.status === 'reservado' &&
        s.dataAgendada &&
        new Date(s.dataAgendada) >= agora &&
        new Date(s.dataAgendada) <= limite
    )
    const agendaOk = !conflito
    if (!agendaOk) {
      motivos.push('Há um agendamento reservado no período solicitado')
    }

    return { disponivel: motivos.length === 0, motivos, capacidadeOk, agendaOk }
  }

  async solicitarAcesso(tipo: TipoSolicitacao, tempoMin: number, dataAgendada?: string): Promise<Solicitacao> {
    const store = useBibliotecaStore.getState()
    const { usuarioLogadoId } = store.ui
    if (!usuarioLogadoId) throw new Error('Não autenticado')

    // RN6 — Se tem livro pendente e tipo NÃO é devolucao, bloquear
    const emprestimoAberto = store.emprestimos.find(
      (e) => e.alunoId === usuarioLogadoId && e.dataDevolucao === null
    )
    if (emprestimoAberto && tipo !== 'devolucao') {
      throw new Error('RN6: Você tem um livro pendente de devolução. Use o tipo "Devolução".')
    }

    const status = tipo === 'agendada' ? 'reservado' : 'pendente'

    const solicitacao: Solicitacao = {
      id: generateId('sol'),
      tipo,
      alunoId: usuarioLogadoId,
      tempoEstimadoMin: tempoMin,
      dataAgendada: dataAgendada ?? null,
      status,
      criadoEm: new Date().toISOString(),
    }

    store.addSolicitacao(solicitacao)
    return solicitacao
  }

  async confirmarEntrada(solicitacaoId: string): Promise<Sessao> {
    // RN7 — Momento 2: confirmação presencial pelo Colaborador
    const store = useBibliotecaStore.getState()
    const solicitacao = store.solicitacoes.find((s) => s.id === solicitacaoId)
    if (!solicitacao) throw new Error('Solicitação não encontrada')
    if (!['pendente', 'reservado'].includes(solicitacao.status)) {
      throw new Error(`Solicitação em status inválido: ${solicitacao.status}`)
    }

    store.updateSolicitacao(solicitacaoId, { status: 'aprovado' })

    const sessao: Sessao = {
      id: generateId('sess'),
      alunoId: solicitacao.alunoId,
      solicitacaoId,
      inicio: new Date().toISOString(),
      tempoEstimadoMin: solicitacao.tempoEstimadoMin,
      status: 'ativa',
      livroVinculadoId: null,
    }

    store.addSessao(sessao)
    store.setSessaoAtiva(sessao.id)
    return sessao
  }

  async sairSemLivro(sessaoId: string): Promise<Sessao> {
    const store = useBibliotecaStore.getState()
    const sessao = store.sessoes.find((s) => s.id === sessaoId)
    if (!sessao) throw new Error('Sessão não encontrada')

    store.updateSessao(sessaoId, { status: 'aguardando_saida' })
    return { ...sessao, status: 'aguardando_saida' }
  }

  async pegarLivro(sessaoId: string, livroId: string, dias: number): Promise<Sessao> {
    const store = useBibliotecaStore.getState()
    const sessao = store.sessoes.find((s) => s.id === sessaoId)
    if (!sessao) throw new Error('Sessão não encontrada')

    // RN1 — 1 livro por vez
    const emprestimoAberto = store.emprestimos.find(
      (e) => e.alunoId === sessao.alunoId && e.dataDevolucao === null
    )
    if (emprestimoAberto) throw new Error('RN1: Aluno já possui um livro emprestado.')

    const livro = store.livros.find((l) => l.id === livroId)
    if (!livro || !livro.disponivel) throw new Error('Livro indisponível')

    const agora = new Date()
    const emprestimo = {
      id: generateId('emp'),
      alunoId: sessao.alunoId,
      livroId,
      dataEmprestimo: agora.toISOString(),
      diasParaDevolver: dias,
      dataPrevista: addMinutes(agora, dias * 24 * 60).toISOString(),
      dataDevolucao: null,
    }

    store.addEmprestimo(emprestimo)
    store.upsertLivro({ ...livro, disponivel: false })
    store.updateSessao(sessaoId, { livroVinculadoId: livroId, status: 'aguardando_saida' })

    return { ...sessao, livroVinculadoId: livroId, status: 'aguardando_saida' }
  }

  async devolverLivro(sessaoId: string, livroId: string): Promise<Sessao> {
    const store = useBibliotecaStore.getState()
    const sessao = store.sessoes.find((s) => s.id === sessaoId)
    if (!sessao) throw new Error('Sessão não encontrada')

    const emprestimo = store.emprestimos.find(
      (e) => e.alunoId === sessao.alunoId && e.livroId === livroId && e.dataDevolucao === null
    )
    if (!emprestimo) throw new Error('Empréstimo ativo não encontrado para este livro')

    const livro = store.livros.find((l) => l.id === livroId)
    if (livro) store.upsertLivro({ ...livro, disponivel: true })

    store.updateEmprestimo(emprestimo.id, { dataDevolucao: new Date().toISOString() })
    store.updateSessao(sessaoId, { status: 'aguardando_saida' })

    return { ...sessao, status: 'aguardando_saida' }
  }

  async confirmarSaida(sessaoId: string): Promise<Sessao> {
    const store = useBibliotecaStore.getState()
    const sessao = store.sessoes.find((s) => s.id === sessaoId)
    if (!sessao) throw new Error('Sessão não encontrada')

    store.updateSessao(sessaoId, { status: 'encerrada' })
    store.setSessaoAtiva(null)

    return { ...sessao, status: 'encerrada' }
  }

  async getSessaoAtual(): Promise<Sessao | null> {
    const store = useBibliotecaStore.getState()
    const { usuarioLogadoId } = store.ui
    if (!usuarioLogadoId) return null
    return (
      store.sessoes.find(
        (s) =>
          s.alunoId === usuarioLogadoId &&
          (s.status === 'ativa' || s.status === 'aguardando_saida')
      ) ?? null
    )
  }

  async getEmprestimoAtivo(): Promise<Emprestimo | null> {
    const store = useBibliotecaStore.getState()
    const { usuarioLogadoId } = store.ui
    if (!usuarioLogadoId) return null
    return (
      store.emprestimos.find((e) => e.alunoId === usuarioLogadoId && e.dataDevolucao === null) ?? null
    )
  }
}
