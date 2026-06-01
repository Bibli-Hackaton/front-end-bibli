// Cliente HTTP base para os serviços reais (backend NestJS).
// Centraliza: base URL, headers JSON, desembrulho do envelope { data } do
// ResponseInterceptor global e propagação da mensagem de erro do backend.
// Os próximos serviços (acervo, solicitações, etc.) reutilizam estas funções.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// Chave do token no sessionStorage — exportada para o AuthService gravar/ler.
// sessionStorage (e não localStorage) é proposital: a sessão de auth é por ABA,
// igual ao ui.usuarioLogadoId. Assim o fluxo de demo com duas abas (Aluno numa,
// Colaborador noutra) funciona — cada aba mantém o próprio token. Com localStorage
// o segundo login sobrescreveria o token e as duas abas autenticariam como o mesmo
// usuário (causando 403 "Acesso restrito para este papel").
export const TOKEN_KEY = 'bibli.token'

// Erro de API com o status HTTP, para os serviços tratarem casos como 404 → null.
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions {
  method: string
  body?: unknown
  /** Anexa o header Authorization: Bearer <token> se houver token salvo. */
  auth?: boolean
}

async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options.auth) {
    const token = sessionStorage.getItem(TOKEN_KEY)
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  // Corpo pode estar vazio (ex.: 204). Tenta parsear com segurança.
  const texto = await response.text()
  const json = texto ? JSON.parse(texto) : null

  if (!response.ok) {
    const mensagem =
      (json && (json.message || json.error)) || 'Erro ao comunicar com o servidor'
    // NestJS às vezes manda message como array de strings de validação.
    throw new ApiError(
      Array.isArray(mensagem) ? mensagem.join('; ') : mensagem,
      response.status,
    )
  }

  // ResponseInterceptor global embrulha o payload em { data, timestamp }.
  // Importante: usar `'data' in json` (não `?? `), senão um `data: null`
  // legítimo (ex.: GET /sessions/current sem sessão) cairia no envelope inteiro.
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T
  }
  return json as T
}

export const apiClient = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: 'GET', auth }),
  post: <T>(path: string, body?: unknown, auth = false) =>
    request<T>(path, { method: 'POST', body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: 'PATCH', body, auth }),
  del: <T>(path: string, auth = true) => request<T>(path, { method: 'DELETE', auth }),
}
