import { useBibliotecaStore } from '@/store/bibliotecaStore'
import type { IAuthService } from '../AuthService'
import type { Usuario, Papel } from '@/types'

export class AuthServiceMock implements IAuthService {
  async login(usuarioId: string): Promise<Usuario> {
    const store = useBibliotecaStore.getState()
    const usuario = store.usuarios.find((u) => u.id === usuarioId)
    if (!usuario) throw new Error('Usuário não encontrado')
    store.setUsuarioLogado(usuarioId)
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
