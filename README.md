# Bibli — Frontend

Sistema de **biblioteca autônoma** (sem bibliotecário): o aluno solicita acesso e pega/devolve
livros num totem com leitor RFID e webcam, e um **Colaborador** confirma entrada/saída
presencialmente. O painel do **Administrador** gerencia acervo, configurações e inventário.

Este repositório é o **frontend** (React + Vite). Ele consome o backend
[**backend-nestjs**](https://github.com/Bibli-Hackaton/backend-nestjs) (NestJS + PostgreSQL).

> Para rodar o sistema completo você precisa subir **os dois projetos**: primeiro o backend
> (com banco de dados), depois este frontend. O guia abaixo cobre tudo do zero.

---

## 1. Pré-requisitos

Instale antes de começar:

| Ferramenta | Versão | Observação |
|---|---|---|
| [Node.js](https://nodejs.org) | **20 ou superior** | inclui o `npm`. Confira com `node -v` |
| [Git](https://git-scm.com) | qualquer recente | para clonar os repositórios |
| **Banco PostgreSQL** | 14+ | use o [Supabase](https://supabase.com) (gratuito, recomendado) **ou** um Postgres local |

> Não é preciso instalar Postgres na máquina se usar o Supabase — basta criar um projeto
> gratuito e pegar os dados de conexão (host, usuário, senha).

---

## 2. Subir o backend (NestJS + PostgreSQL)

O frontend não funciona sozinho no modo completo — ele faz login e busca dados de uma API real.
Comece pelo backend.

### 2.1. Clonar e instalar

```bash
git clone https://github.com/Bibli-Hackaton/backend-nestjs.git
cd backend-nestjs
npm install
```

### 2.2. Configurar variáveis de ambiente

Copie o exemplo e preencha o `.env`:

```bash
cp .env.example .env
```

Edite o `.env` com os dados do **seu** banco e os segredos:

```bash
# Aplicação
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173   # endereço do frontend (não mude se for rodar local)

# Banco de dados (Supabase ou Postgres local)
DB_HOST=...          # ex.: db.xxxx.supabase.co  (ou localhost)
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=...      # a senha do seu banco
DB_NAME=postgres

# Auth / JWT
JWT_SECRET=...       # gere um valor forte: openssl rand -hex 32
JWT_EXPIRES_IN=24h

# Admin inicial (criado pelo passo de seed)
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@bibli.com
ADMIN_PASSWORD=umaSenhaForte123
```

> ⚠️ Nunca versione o `.env` — ele contém segredos. O arquivo já está no `.gitignore`.
> Se faltar alguma variável essencial, o backend **não sobe** e mostra qual está faltando.

### 2.3. Criar as tabelas (migrations)

O schema é gerenciado por migrations (não há criação automática de tabelas). Rode uma vez:

```bash
npm run migration:run
```

### 2.4. Criar o usuário administrador (seed)

Cria o admin a partir das variáveis `ADMIN_*` do `.env`:

```bash
npm run seed
```

### 2.5. Iniciar o backend

```bash
npm run start:dev
```

O backend sobe em **http://localhost:3000** (todas as rotas têm prefixo `/api`).
A documentação interativa da API (Swagger) fica em **http://localhost:3000/docs**.

Deixe esse terminal rodando e abra **outro terminal** para o frontend.

---

## 3. Subir o frontend (este projeto)

### 3.1. Clonar e instalar

```bash
git clone https://github.com/Bibli-Hackaton/front-end-bibli.git
cd front-end-bibli
npm install
```

### 3.2. Apontar o frontend para o backend

Crie um arquivo **`.env.local`** na raiz do projeto com:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

É essa variável que liga o frontend ao backend real. Sem ela, o app cai no modo
mock (dados em memória — útil só para desenvolver a interface). **Com ela definida, todos os
serviços usam a API.**

### 3.3. Rodar

```bash
npm run dev
```

Abra **http://localhost:5173**.

---

## 4. Primeiro acesso e criação de usuários

O seed cria **apenas o administrador**. Para exercitar o fluxo completo você precisa de pelo
menos um **aluno** e um **colaborador**, além de alguns **livros**.

### 4.1. Entrar como admin

Na tela de login do frontend, use o email/senha definidos em `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### 4.2. Criar aluno e colaborador

A criação de usuários é uma rota protegida (só admin). O jeito mais fácil é pela Swagger UI:

1. Abra **http://localhost:3000/docs**.
2. Em `POST /api/auth/login`, faça login com o admin e copie o `token` da resposta.
3. Clique em **Authorize** (cadeado, topo da página) e cole o token.
4. Em `POST /api/users`, crie os usuários com este corpo (o campo `role` aceita
   `aluno`, `colaborador` ou `admin`):

```json
{
  "name": "Ana Silva",
  "email": "ana@bibli.com",
  "password": "senha12345",
  "role": "aluno"
}
```

Repita para um `colaborador`. A senha precisa ter no mínimo 8 caracteres.

### 4.3. Cadastrar livros

Logado como admin no frontend, vá em **Acervo** e adicione alguns livros (título, autor,
tag RFID, localização). Eles aparecerão para o aluno no totem.

---

## 5. Testando o fluxo completo

O sistema é multiusuário em tempo real. Para ver o fluxo ponta a ponta, abra **duas abas**:

1. **Aba 1 — Aluno:** faça login como aluno, solicite acesso (entrar na biblioteca).
2. **Aba 2 — Colaborador:** faça login como colaborador e **confirme a entrada** do aluno.
3. De volta na aba do aluno, use o totem para **pegar** ou **devolver** um livro
   (o simulador de RFID e a webcam aparecem na tela para a demo).
4. O **Admin** acompanha acervo, empréstimos em aberto e alertas em **Inventário**.

---

## 6. Scripts disponíveis (frontend)

```bash
npm run dev       # servidor de desenvolvimento (http://localhost:5173)
npm run build     # build de produção (tsc -b && vite build)
npm run preview   # pré-visualiza o build de produção
npm run lint      # ESLint
```

---

## 7. Arquitetura (visão rápida)

Toda comunicação com dados passa por uma **camada de serviço** (`src/services/`), o que permite
trocar entre mock e backend sem mexer nos componentes:

- `src/services/*.ts` — interfaces dos serviços (`authService`, `bibliotecaService`,
  `acervoService`, `solicitacaoService`, `adminService`).
- `src/services/mock/` — implementações em memória (usadas quando `VITE_API_BASE_URL` está ausente).
- `src/services/http/` — implementações que falam com o backend NestJS (usadas quando
  `VITE_API_BASE_URL` está definido).
- `src/services/index.ts` — decide qual usar com base em `VITE_API_BASE_URL`.

```
src/
├── types/          # Tipos de domínio (pt) + DTOs do backend (en)
├── store/          # Zustand (estado global; seed de demo no modo mock)
├── services/       # Interfaces + implementações mock e HTTP
├── mocks/hardware/ # Simuladores de RFID, Tranca e Webcam (demo)
├── components/     # shadcn/ui + shared + layout
├── pages/          # Telas: Login, Aluno, Colaborador, Admin
├── hooks/          # hooks utilitários (ex.: usePolling)
└── router/         # React Router + guards por papel
```

**Referência da API:** a lista viva e atualizada de endpoints está na Swagger UI do backend
em `http://localhost:3000/docs`. Os principais grupos são `auth`, `users`, `books`, `loans`,
`config`, `sessions` e `access-requests` (todos sob o prefixo `/api`).

### Simuladores de hardware

Como é um MVP, o hardware é simulado no navegador. No sistema real, cada um vira uma integração:

| Arquivo | Hardware real |
|---------|---------------|
| `src/mocks/hardware/LeitorRFID.ts` | ESP32 + leitor RFID (serial/WebSocket) |
| `src/mocks/hardware/Tranca.ts` | ESP32 + relé de tranca elétrica (MQTT/HTTP) |
| `src/mocks/hardware/Webcam.ts` | Câmera + API de visão computacional |

---

## 8. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Login dá "Credenciais inválidas" | Backend no ar mas sem usuários, ou email/senha errados | Rode `npm run seed` no backend e use `ADMIN_EMAIL`/`ADMIN_PASSWORD`. Crie aluno/colaborador (passo 4.2). |
| Erros de rede / nada carrega | Backend não está rodando, ou `VITE_API_BASE_URL` errado | Confirme o backend em `http://localhost:3000/docs` e o `.env.local` do frontend. |
| Erro de CORS no console | `CORS_ORIGIN` do backend diferente da URL do frontend | No `.env` do backend, use `CORS_ORIGIN=http://localhost:5173`. |
| Backend não sobe | Variável de ambiente faltando ou banco inacessível | Leia a mensagem de erro; confira `DB_*` e `JWT_SECRET` no `.env`. |
| Tabelas não existem | Migrations não rodaram | Rode `npm run migration:run` no backend. |

> Dica: o estado de UI (login) é por aba — por isso o fluxo de demo usa duas abas.

---

## 9. Deploy (Vercel)

O frontend é uma SPA estática e faz deploy na Vercel a cada push na `main`; Pull Requests geram
preview URLs. O `vercel.json` redireciona todas as rotas para `index.html` (evita 404 ao dar
refresh em rotas internas como `/colaborador`).

**Variáveis de ambiente:** configure em **Settings → Environment Variables** da Vercel. Defina
`VITE_API_BASE_URL` apontando para a URL pública do backend. Variáveis `VITE_` ficam embutidas no
bundle do cliente — **não coloque segredos nelas**.
