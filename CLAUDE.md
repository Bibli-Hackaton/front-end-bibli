# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server at http://localhost:5173
npm run build     # tsc -b && vite build
npm run lint      # ESLint
npm run preview   # preview production build
```

No test runner is configured. Verification is done by running the app and exercising flows manually or with Playwright.

## Architecture

This is a **frontend-only MVP** (hackathon demo) with all state in-memory. No backend, no localStorage. The architecture is designed so that swapping to a real FastAPI backend requires only implementing HTTP service classes and setting `VITE_USE_MOCK=false`.

### Service layer (the central pattern)

Components never read domain data directly from Zustand. All domain operations go through `src/services/`:

```
src/services/
├── *.ts              # interfaces (each method has a // FUTURO BACKEND: comment)
├── mock/             # Zustand-backed implementations
└── index.ts          # factory: VITE_USE_MOCK !== 'false' → mocks, else → HTTP (not yet implemented)
```

The five services are exported from `src/services/index.ts`: `authService`, `bibliotecaService`, `acervoService`, `solicitacaoService`, `adminService`.

**Exception:** UI state (`usuarioLogadoId`, `sessaoAtivaId`) is read directly from Zustand — it's per-tab state, not domain.

### Zustand store (`src/store/bibliotecaStore.ts`)

Single store holding all domain data. The exported `BibliotecaState` interface includes both data and mutation methods. Computed selectors live at module level (e.g., `selecionarEmprestimoAberto`, `selecionarSessaoAtiva`).

**BroadcastChannel sync** at the bottom of the file propagates domain state changes across browser tabs (same origin). UI state is intentionally NOT synced — each tab has its own login session. The `_receivingExternal` flag prevents infinite loops.

### Hardware mocks (`src/mocks/hardware/`)

Three hardware abstractions, each backed by its own small Zustand store:

- `LeitorRFID` — `ler()` returns a `Promise<string>` that only resolves when `simularLeitura(tag)` is called. State: `idle | aguardando | lido | erro`.
- `Tranca` — `abrir()` / `fechar()` with animation delays. State: `fechada | abrindo | aberta | fechando`.
- `Webcam` — `confirmarLivro()` returns `Promise<boolean>`; resolved by `simularResultado(bool)`.

### Routing and auth

`src/router/index.tsx` has an `AuthGuard` component that reads `useBibliotecaStore().ui.usuarioLogadoId`. Unauthenticated → `/login`; wrong role → redirect to own role home.

Routes:
- `/aluno`, `/aluno/sessao` — role: `aluno`
- `/colaborador` — role: `colaborador`
- `/admin/config`, `/admin/acervo`, `/admin/inventario` — role: `admin`

## Seed data (demo users)

| id | Nome | Papel | Notes |
|----|------|-------|-------|
| u1 | Ana Silva | aluno | clean state |
| u2 | Bruno Costa | aluno | has open loan for l3 (Sistemas Operacionais) |
| u3 | Carla Mendes | aluno | clean state |
| u4 | Diego Ferreira | colaborador | |
| u5 | Elisa Rocha | admin | |

Config defaults: `capacidadeSala: 1`, `tempoMaxSessaoMin: 120`, `diasPadraoEmprestimo: 14`.

## Business rules

Enforced in `BibliotecaServiceMock.ts`:

- **RN1** — one book at a time per student (`pegarLivro`)
- **RN2** — room capacity check (`verificarDisponibilidade`)
- **RN5** — no conflicting scheduled reservations
- **RN6** — student with open loan can only request type `'devolucao'`; `'agora'`/`'agendada'` are blocked
- **RN7** — two-moment model: `solicitarAcesso()` (student, creates `pendente`) is separate from `confirmarEntrada()` (collaborator only, creates `Sessao`)

## Design system

- Primary: `#9b1b22` (institutional red)
- Font: Manrope (Google Fonts, imported in `globals.css`)
- CSS tokens in `src/styles/globals.css` (Tailwind v4 via `@tailwindcss/vite`)
- Path alias: `@/` → `src/`
- shadcn/ui components live in `src/components/ui/` — hand-written with Radix Primitives + CVA + tailwind-merge (no CLI)

## Key constraints

- **Never F5/reload** mid-flow — all state is in-memory and is lost on page reload. Navigate within the SPA only.
- The **Reset button** (top-right) calls `useBibliotecaStore.getState().reset()` to restore seed state.
- Cross-tab reactivity relies on BroadcastChannel — requires same origin and a real browser (not SSR/Node).
