import { create } from 'zustand'
import { addMinutes } from '@/lib/utils'
import type {
  Usuario,
  Livro,
  Emprestimo,
  Solicitacao,
  Sessao,
  Alerta,
  Config,
  UIState,
} from '@/types'

// ─── Seed de dados mock ──────────────────────────────────────────────────────

const USUARIOS_SEED: Usuario[] = [
  { id: 'u1', nome: 'Ana Silva', papel: 'aluno', avatarInicial: 'AS' },
  { id: 'u2', nome: 'Bruno Costa', papel: 'aluno', avatarInicial: 'BC' },
  { id: 'u3', nome: 'Carla Mendes', papel: 'aluno', avatarInicial: 'CM' },
  { id: 'u4', nome: 'Diego Ferreira', papel: 'colaborador', avatarInicial: 'DF' },
  { id: 'u5', nome: 'Elisa Rocha', papel: 'admin', avatarInicial: 'ER' },
]

const LIVROS_SEED: Livro[] = [
  { id: 'l1', titulo: 'Algoritmos: Teoria e Prática', autor: 'Thomas H. Cormen', tagRfid: 'RFID-001', disponivel: true, localizacao: 'Estante A1', isbn: '978-85-352-3988-6' },
  { id: 'l2', titulo: 'Engenharia de Software', autor: 'Roger Pressman', tagRfid: 'RFID-002', disponivel: true, localizacao: 'Estante A2', isbn: '978-85-8055-044-3' },
  { id: 'l3', titulo: 'Sistemas Operacionais', autor: 'Andrew Tanenbaum', tagRfid: 'RFID-003', disponivel: false, localizacao: 'Estante B1' },
  { id: 'l4', titulo: 'Banco de Dados', autor: 'Abraham Silberschatz', tagRfid: 'RFID-004', disponivel: true, localizacao: 'Estante B2', isbn: '978-85-7608-739-8' },
  { id: 'l5', titulo: 'Redes de Computadores', autor: 'James Kurose', tagRfid: 'RFID-005', disponivel: true, localizacao: 'Estante C1' },
]

// Bruno já tem o livro l3 emprestado (para demo)
const EMPRESTIMOS_SEED: Emprestimo[] = [
  {
    id: 'e1',
    alunoId: 'u2',
    livroId: 'l3',
    dataEmprestimo: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    diasParaDevolver: 14,
    dataPrevista: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
    dataDevolucao: null,
  },
]

const CONFIG_DEFAULT: Config = {
  tempoMaxSessaoMin: 120,
  diasPadraoEmprestimo: 14,
  capacidadeSala: 1,
}

// ─── Estado do store ─────────────────────────────────────────────────────────

export interface BibliotecaState {
  // Domínio
  usuarios: Usuario[]
  livros: Livro[]
  emprestimos: Emprestimo[]
  solicitacoes: Solicitacao[]
  sessoes: Sessao[]
  alertas: Alerta[]
  config: Config

  // UI
  ui: UIState

  // Mutações de domínio
  setUsuarios: (u: Usuario[]) => void
  upsertUsuario: (u: Usuario) => void
  setLivros: (l: Livro[]) => void
  upsertLivro: (l: Livro) => void
  removeLivro: (id: string) => void
  addEmprestimo: (e: Emprestimo) => void
  updateEmprestimo: (id: string, patch: Partial<Emprestimo>) => void
  addSolicitacao: (s: Solicitacao) => void
  updateSolicitacao: (id: string, patch: Partial<Solicitacao>) => void
  addSessao: (s: Sessao) => void
  updateSessao: (id: string, patch: Partial<Sessao>) => void
  addAlerta: (a: Alerta) => void
  resolverAlerta: (id: string) => void
  setConfig: (c: Config) => void
  patchConfig: (patch: Partial<Config>) => void

  // UI
  setUsuarioLogado: (id: string | null) => void
  setSessaoAtiva: (id: string | null) => void

  // Reset (demo)
  reset: () => void
}

// Em modo backend (VITE_API_BASE_URL definido) o domínio começa VAZIO —
// dados reais vêm dos serviços HTTP. Sem backend, usa os seeds da demo.
const MODO_BACKEND = !!import.meta.env.VITE_API_BASE_URL

const initialState = () => ({
  usuarios: MODO_BACKEND ? [] : USUARIOS_SEED,
  livros: MODO_BACKEND ? [] : LIVROS_SEED,
  emprestimos: MODO_BACKEND ? [] : EMPRESTIMOS_SEED,
  solicitacoes: [] as Solicitacao[],
  sessoes: [] as Sessao[],
  alertas: [] as Alerta[],
  config: CONFIG_DEFAULT,
  ui: { usuarioLogadoId: null, sessaoAtivaId: null } as UIState,
})

export const useBibliotecaStore = create<BibliotecaState>((set) => ({
  ...initialState(),

  setUsuarios: (usuarios) => set({ usuarios }),
  upsertUsuario: (u) =>
    set((s) => ({
      usuarios: s.usuarios.some((x) => x.id === u.id)
        ? s.usuarios.map((x) => (x.id === u.id ? u : x))
        : [...s.usuarios, u],
    })),

  setLivros: (livros) => set({ livros }),
  upsertLivro: (l) =>
    set((s) => ({
      livros: s.livros.some((x) => x.id === l.id)
        ? s.livros.map((x) => (x.id === l.id ? l : x))
        : [...s.livros, l],
    })),
  removeLivro: (id) => set((s) => ({ livros: s.livros.filter((l) => l.id !== id) })),

  addEmprestimo: (e) => set((s) => ({ emprestimos: [...s.emprestimos, e] })),
  updateEmprestimo: (id, patch) =>
    set((s) => ({ emprestimos: s.emprestimos.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),

  addSolicitacao: (sol) => set((s) => ({ solicitacoes: [...s.solicitacoes, sol] })),
  updateSolicitacao: (id, patch) =>
    set((s) => ({ solicitacoes: s.solicitacoes.map((s2) => (s2.id === id ? { ...s2, ...patch } : s2)) })),

  addSessao: (sess) => set((s) => ({ sessoes: [...s.sessoes, sess] })),
  updateSessao: (id, patch) =>
    set((s) => ({ sessoes: s.sessoes.map((s2) => (s2.id === id ? { ...s2, ...patch } : s2)) })),

  addAlerta: (a) => set((s) => ({ alertas: [...s.alertas, a] })),
  resolverAlerta: (id) =>
    set((s) => ({ alertas: s.alertas.map((a) => (a.id === id ? { ...a, resolvido: true } : a)) })),

  setConfig: (config) => set({ config }),
  patchConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),

  setUsuarioLogado: (id) => set((s) => ({ ui: { ...s.ui, usuarioLogadoId: id } })),
  setSessaoAtiva: (id) => set((s) => ({ ui: { ...s.ui, sessaoAtivaId: id } })),

  reset: () => set({ ...initialState() }),
}))

// Seletores computados (usar em componentes, nunca nos serviços)
export const selecionarUsuario = (id: string) => (s: BibliotecaState) =>
  s.usuarios.find((u) => u.id === id)

export const selecionarEmprestimoAberto = (alunoId: string) => (s: BibliotecaState) =>
  s.emprestimos.find((e) => e.alunoId === alunoId && e.dataDevolucao === null)

export const selecionarSessaoAtiva = (s: BibliotecaState) =>
  s.sessoes.find((sess) => sess.status === 'ativa' || sess.status === 'aguardando_saida')

export const selecionarSolicitacoesPendentes = (s: BibliotecaState) =>
  s.solicitacoes.filter((sol) => sol.status === 'pendente')

export const selecionarReservas = (s: BibliotecaState) =>
  s.solicitacoes.filter((sol) => sol.status === 'reservado')

export const selecionarAlertasAtivos = (s: BibliotecaState) =>
  s.alertas.filter((a) => !a.resolvido)

export { addMinutes }

// ─── BroadcastChannel: sincronizar estado de domínio entre abas ──────────────
// Cada aba tem seu próprio heap JS; este canal propaga mutações de dados
// para que Aluno (aba A) e Colaborador (aba B) vejam o mesmo estado.
// Sincroniza apenas estado de domínio — ui.usuarioLogadoId é por-aba.

type DomainSlice = Pick<
  BibliotecaState,
  'usuarios' | 'livros' | 'emprestimos' | 'solicitacoes' | 'sessoes' | 'alertas' | 'config'
>

const BC_CHANNEL = 'biblioteca-domain-sync-v1'
const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(BC_CHANNEL) : null

let _receivingExternal = false

// Ao mutar estado local → transmitir para outras abas
useBibliotecaStore.subscribe((state) => {
  if (_receivingExternal || !bc) return
  const payload: DomainSlice = {
    usuarios: state.usuarios,
    livros: state.livros,
    emprestimos: state.emprestimos,
    solicitacoes: state.solicitacoes,
    sessoes: state.sessoes,
    alertas: state.alertas,
    config: state.config,
  }
  bc.postMessage({ type: 'DOMAIN_SYNC', payload })
})

// Ao receber de outra aba → aplicar localmente (sem re-transmitir)
if (bc) {
  bc.onmessage = (event: MessageEvent) => {
    if (event.data?.type !== 'DOMAIN_SYNC') return
    _receivingExternal = true
    useBibliotecaStore.setState(event.data.payload as DomainSlice)
    _receivingExternal = false
  }
}
