import { useBibliotecaStore } from '@/store/bibliotecaStore'
import { iniciaisDoNome } from '@/lib/utils'
import { apiClient, TOKEN_KEY } from './apiClient'
import type { IAuthService } from '../AuthService'
import type { Usuario, Papel } from '@/types'
import type { AuthUserDTO, LoginResponseDTO } from '@/types/dto'

const USER_KEY = 'bibli.user'

function mapAuthUser(dto: AuthUserDTO): Usuario {
  return {
    id: dto.id,
    nome: dto.name,
    papel: dto.role, // backend já retorna aluno/colaborador/admin
    avatarInicial: iniciaisDoNome(dto.name),
    email: dto.email,
  }
}

export class AuthServiceHTTP implements IAuthService {
  constructor() {
    // Restaura a sessão do localStorage no boot. Como este serviço é
    // instanciado no import de services/index.ts (antes do router renderizar),
    // o store já tem o usuário logado na primeira renderização — sem flash.
    this.restaurarSessao()
  }

  private restaurarSessao() {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return
    try {
      const usuario = JSON.parse(raw) as Usuario
      const store = useBibliotecaStore.getState()
      store.upsertUsuario(usuario)
      store.setUsuarioLogado(usuario.id)
    } catch {
      // JSON corrompido — limpa para evitar loop de erro.
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  async login(email: string, password: string): Promise<Usuario> {
    const resposta = await apiClient.post<LoginResponseDTO>('/api/auth/login', {
      email,
      password,
    })

    const usuario = mapAuthUser(resposta.user)

    localStorage.setItem(TOKEN_KEY, resposta.accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(usuario))

    const store = useBibliotecaStore.getState()
    store.upsertUsuario(usuario)
    store.setUsuarioLogado(usuario.id)

    return usuario
  }

  async logout(): Promise<void> {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    useBibliotecaStore.getState().setUsuarioLogado(null)
  }

  async getUsuarioAtual(): Promise<Usuario | null> {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as Usuario
    } catch {
      return null
    }
  }

  async listarUsuariosPorPapel(_papel: Papel): Promise<Usuario[]> {
    throw new Error('listarUsuariosPorPapel não é suportado no backend real')
  }
}
