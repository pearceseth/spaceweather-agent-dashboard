# Space Weather Dashboard

Full-stack TypeScript monorepo. Read this before making any changes.

---

## Layout

```
space-weather/
├── packages/
│   ├── types/   @space-weather/types  — shared domain types (source of truth)
│   ├── api/     @space-weather/api    — Effect-TS HTTP backend
│   ├── agent/   @space-weather/agent  — Claude tool-use agentic layer
│   └── web/     @space-weather/web    — Next.js frontend
├── docs/                              — markdown documentation
├── .claude/
│   ├── commands/                      — slash command definitions
│   ├── plans/                         — task plans (subagent output)
│   └── reviews/                       — task reviews (subagent output)
└── todos.md                           — project task list
```

**Build order:** `types` → `agent` + `api` → `web`
**Never** import from `api` or `web` into `types`.
**Never** import from `web` into `api`.

Each package has its own `CLAUDE.md` with package-specific conventions.
Read it when working in that package.

---

## Commands

```bash
pnpm install                                # install all workspaces
pnpm dev                                    # start everything
pnpm --filter @space-weather/api dev        # start one package
pnpm --filter @space-weather/api test       # test one package
pnpm --filter @space-weather/api typecheck  # typecheck one package
pnpm build                                  # build all in correct order
```

**Never** use `npm` or `yarn`. **Never** use `npm install`.

---

## The One Rule That Overrides Everything

**All types shared between packages live in `@space-weather/types`.**

Never define an API response shape in `packages/api/`.
Never define a response type in `packages/web/`.
If a type crosses any package boundary → it belongs in `@space-weather/types`.

---

## Git

- Branches: `feature/<slug>`, `fix/<slug>`
- Commits: conventional format — `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`
- Never commit to `main` directly
- Never commit `.env`, `.env.local`, or any `.env.*` file
- Never commit `.claude/plans/` or `.claude/reviews/` — working files only

---

## Hard Stops (Never Do These)

- No `any` — use `unknown` and narrow with guards or Schema
- No `as` casts except at Schema decode boundaries
- No `console.log` in production code — use Effect's logging
- No real HTTP calls in tests — mock all clients with `vi.mock()`
- No business logic in route handlers
- No new dependencies in `packages/types/` — only `effect` and `@effect/schema`
- No installing packages without checking if an existing Effect utility covers it
