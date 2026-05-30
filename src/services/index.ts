// Ponto único de acesso à camada de serviço.
// Quando VITE_API_BASE_URL está definido, todos os serviços usam o backend
// real (HTTP); caso contrário, usam os mocks em memória (demo).
// Nota: AdminServiceHTTP delega ao mock os métodos sem endpoint (inventário/
// alertas/empréstimos) até que existam no backend.

import type { IAuthService } from './AuthService'
import type { IBibliotecaService } from './BibliotecaService'
import type { IAcervoService } from './AcervoService'
import type { ISolicitacaoService } from './SolicitacaoService'
import type { IAdminService } from './AdminService'

import { AuthServiceMock } from './mock/AuthServiceMock'
import { BibliotecaServiceMock } from './mock/BibliotecaServiceMock'
import { AcervoServiceMock } from './mock/AcervoServiceMock'
import { SolicitacaoServiceMock } from './mock/SolicitacaoServiceMock'
import { AdminServiceMock } from './mock/AdminServiceMock'

import { AuthServiceHTTP } from './http/AuthServiceHTTP'
import { AcervoServiceHTTP } from './http/AcervoServiceHTTP'
import { AdminServiceHTTP } from './http/AdminServiceHTTP'
import { BibliotecaServiceHTTP } from './http/BibliotecaServiceHTTP'
import { SolicitacaoServiceHTTP } from './http/SolicitacaoServiceHTTP'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

export const authService: IAuthService = apiBaseUrl
  ? new AuthServiceHTTP()
  : new AuthServiceMock()

export const bibliotecaService: IBibliotecaService = apiBaseUrl
  ? new BibliotecaServiceHTTP()
  : new BibliotecaServiceMock()

export const acervoService: IAcervoService = apiBaseUrl
  ? new AcervoServiceHTTP()
  : new AcervoServiceMock()

export const solicitacaoService: ISolicitacaoService = apiBaseUrl
  ? new SolicitacaoServiceHTTP()
  : new SolicitacaoServiceMock()

export const adminService: IAdminService = apiBaseUrl
  ? new AdminServiceHTTP()
  : new AdminServiceMock()
