import { useBibliotecaStore } from '@/store/bibliotecaStore'
import type { IAuthService } from '../AuthService'
import type { Usuario, Papel } from '@/types'

export class AuthServiceMock implements IAuthService {
  // O fluxo real usa email/senha contra o backend. Este mock só existe para
  // compilar com VITE_API_BASE_URL ausente; casa por email (campo opcional do
  // seed) ou ignora a senha.
  async login(email: string, _password: string): Promise<Usuario> {
    const store = useBibliotecaStore.getState()
    const usuario = store.usuarios.find((u) => u.email === email)
    if (!usuario) throw new Error('Credenciais inválidas')
    store.setUsuarioLogado(usuario.id)
    return usuario
  }

  async logout(): Promise<void> {
    useBibliotecaStore.getState().setUsuarioLogado(null)
  }

  async getUsuarioAtual(): Promise<Usuario | null> {
    const store = useBibliotecaStore.getState()
    const { usuarioLogadoId } = store.ui
    if (!usuarioLogadoId) return null
    return store.usuarios.find((u) => u.id === usuarioLogadoId) ?? null
  }

  async listarUsuariosPorPapel(papel: Papel): Promise<Usuario[]> {
    return useBibliotecaStore.getState().usuarios.filter((u) => u.papel === papel)
  }
}
