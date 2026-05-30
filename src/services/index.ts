// Ponto único de acesso à camada de serviço.
// Para conectar o backend real: implementar as interfaces com fetch/axios
// e virar a flag VITE_USE_MOCK para false.

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

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

export const authService: IAuthService = useMock
  ? new AuthServiceMock()
  : (() => { throw new Error('HTTP AuthService não implementado') })()

export const bibliotecaService: IBibliotecaService = useMock
  ? new BibliotecaServiceMock()
  : (() => { throw new Error('HTTP BibliotecaService não implementado') })()

export const acervoService: IAcervoService = useMock
  ? new AcervoServiceMock()
  : (() => { throw new Error('HTTP AcervoService não implementado') })()

export const solicitacaoService: ISolicitacaoService = useMock
  ? new SolicitacaoServiceMock()
  : (() => { throw new Error('HTTP SolicitacaoService não implementado') })()

export const adminService: IAdminService = useMock
  ? new AdminServiceMock()
  : (() => { throw new Error('HTTP AdminService não implementado') })()
