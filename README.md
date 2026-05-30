# Biblioteca Universitária Autônoma — Frontend

MVP frontend-only para hackathon. Biblioteca sem bibliotecário, gerenciada por um Colaborador que confirma entrada/saída presencialmente.

## Como rodar

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`. Faça login escolhendo o papel (Aluno, Colaborador ou Administrador) — sem senha, apenas para demo.

Para simular o fluxo completo, abra **duas abas**: uma como **Aluno** e outra como **Colaborador**.

## Camada de serviço — como trocar pelo backend

Toda comunicação com dados passa por `src/services/`. A troca é feita em **um único arquivo**:

```
src/services/index.ts
```

O arquivo decide a implementação via variável de ambiente:

```bash
VITE_USE_MOCK=true   # usa os mocks em memória (padrão)
VITE_USE_MOCK=false  # usa implementações HTTP (não implementadas ainda)
```

Para conectar o backend FastAPI:

1. Crie `src/services/http/AuthServiceHTTP.ts` implementando `IAuthService`
2. Repita para os outros 4 serviços
3. Mude `VITE_USE_MOCK=false` no `.env`

Os componentes **não precisam ser alterados**.

## Endpoints HTTP esperados

Extraídos dos comentários `// FUTURO BACKEND` em cada serviço:

### Auth
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | `body: { papel, usuarioId }` → `{ usuario, token }` |
| POST | `/api/auth/logout` | → 204 |
| GET | `/api/auth/me` | → `{ usuario }` \| 401 |
| GET | `/api/auth/usuarios?papel=<papel>` | → `{ usuarios[] }` |

### Biblioteca
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/biblioteca/disponibilidade` | → `{ disponivel, motivos[] }` |
| POST | `/api/biblioteca/solicitar` | `body: { tipo, tempoMin, dataAgendada? }` → `{ solicitacao }` |
| POST | `/api/biblioteca/confirmar-entrada` | `body: { solicitacaoId }` → `{ sessao }` |
| POST | `/api/biblioteca/sair-sem-livro` | `body: { sessaoId }` → `{ sessao }` |
| POST | `/api/biblioteca/pegar-livro` | `body: { sessaoId, livroId, dias }` → `{ sessao }` |
| POST | `/api/biblioteca/devolver-livro` | `body: { sessaoId, livroId }` → `{ sessao }` |
| POST | `/api/biblioteca/confirmar-saida` | `body: { sessaoId }` → `{ sessao }` |
| GET | `/api/biblioteca/sessao-atual` | → `{ sessao }` \| 404 |

### Acervo
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/acervo/livros` | → `{ livros[] }` |
| GET | `/api/acervo/livros/:id` | → `{ livro }` \| 404 |
| POST | `/api/acervo/livros` | `body: CriarLivroBody` → `{ livro }` |
| PATCH | `/api/acervo/livros/:id` | `body: AtualizarLivroBody` → `{ livro }` |
| DELETE | `/api/acervo/livros/:id` | → 204 |
| GET | `/api/acervo/livros?disponivel=true` | → `{ livros[] }` |
| GET | `/api/acervo/livros?rfid=<tag>` | → `{ livro }` \| 404 |

### Solicitações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/solicitacoes?status=pendente` | → `{ solicitacoes[] }` |
| GET | `/api/solicitacoes?status=reservado` | → `{ solicitacoes[] }` |
| GET | `/api/solicitacoes?alunoId=<id>` | → `{ solicitacoes[] }` |
| PATCH | `/api/solicitacoes/:id` | `body: { status, motivoNegacao? }` → `{ solicitacao }` |

### Admin
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/admin/config` | → `{ config }` |
| PATCH | `/api/admin/config` | `body: SalvarConfigBody` → `{ config }` |
| GET | `/api/admin/inventario` | → `{ stats }` |
| GET | `/api/admin/alertas` | → `{ alertas[] }` |
| PATCH | `/api/admin/alertas/:id/resolver` | → 200 |
| GET | `/api/admin/emprestimos` | → `{ emprestimos[] }` |

## Mocks de hardware

| Arquivo | Hardware real |
|---------|---------------|
| `src/mocks/hardware/LeitorRFID.ts` | ESP32 + leitor RFID serial/WebSocket |
| `src/mocks/hardware/Tranca.ts` | ESP32 + relé de tranca elétrica (MQTT/HTTP) |
| `src/mocks/hardware/Webcam.ts` | Camera + API de visão computacional |

## Estrutura

```
src/
├── types/          # Tipos de domínio + DTOs serializáveis
├── store/          # Zustand (estado global + seed de dados)
├── services/       # Interfaces de serviço + implementações mock
├── mocks/hardware/ # Mocks de RFID, Tranca e Webcam
├── components/     # shadcn/ui + shared + layout
├── pages/          # Telas: Login, Aluno, Colaborador, Admin
└── router/         # React Router v6 + guards por papel
```
