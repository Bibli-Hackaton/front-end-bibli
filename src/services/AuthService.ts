import type { Usuario, Papel } from '@/types'

export interface IAuthService {
  // FUTURO BACKEND: POST /api/auth/login  body: { papel, usuarioId } → 200 { usuario, token }
  login(usuarioId: string): Promise<Usuario>

  // FUTURO BACKEND: POST /api/auth/logout  → 204
  logout(): Promise<void>

  // FUTURO BACKEND: GET /api/auth/me  → 200 { usuario } | 401
  getUsuarioAtual(): Promise<Usuario | null>

  // FUTURO BACKEND: GET /api/auth/usuarios?papel=<papel>  → 200 { usuarios[] }
  listarUsuariosPorPapel(papel: Papel): Promise<Usuario[]>
}
