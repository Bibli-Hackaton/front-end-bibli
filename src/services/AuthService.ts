import type { Usuario, Papel } from '@/types'

export interface IAuthService {
  // BACKEND: POST /api/auth/login  body: { email, password } → 200 { data: { accessToken, user } }
  login(email: string, password: string): Promise<Usuario>

  // FUTURO BACKEND: POST /api/auth/logout  → 204
  logout(): Promise<void>

  // FUTURO BACKEND: GET /api/auth/me  → 200 { usuario } | 401
  getUsuarioAtual(): Promise<Usuario | null>

  // FUTURO BACKEND: GET /api/auth/usuarios?papel=<papel>  → 200 { usuarios[] }
  listarUsuariosPorPapel(papel: Papel): Promise<Usuario[]>
}
