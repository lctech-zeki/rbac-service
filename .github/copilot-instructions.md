# GitHub Copilot Instructions — rbac-service

## Project Overview
A **Role-Based Access Control (RBAC) microservice** — simple, fast, and production-ready.
Monorepo with a Hono API (Bun runtime) and a Vue 3 admin dashboard.

## Monorepo Structure
```
rbac-service/
├── apps/
│   ├── api/              # Hono + Bun + Drizzle — REST API
│   └── web/              # Vue 3 + Vite — admin dashboard
├── packages/
│   └── shared/           # Zod schemas + inferred TS types (shared by both apps)
├── cue/                  # CUE schemas for data model visualization
├── feature_list.json     # Incremental feature checklist
└── copilot-progress.txt  # Session handoff log
```

## Final Tech Stack
| Layer        | Technology                                       |
|--------------|--------------------------------------------------|
| Runtime      | **Bun** ≥ 3.0                                    |
| API          | **Hono** v4.12                                   |
| Validation   | **Zod** v4 (shared via `@rbac/shared`)           |
| ORM          | **Drizzle ORM** v0.44 + `postgres` driver        |
| Database     | PostgreSQL 17                                    |
| Cache        | Redis 7 (ioredis v5)                             |
| Auth         | JWT via `jose` + Redis token deny-list           |
| Frontend     | **Vue 3.5** + Vite 7 + Pinia 3 + Vue Router 5   |
| Styling      | Tailwind CSS v4                                  |
| Schema vis   | **CUE** (cuelang.org)                            |
| Testing      | Bun test (API) · Vitest v4 (Web)                 |
| Package mgr  | Bun workspaces                                   |
| CI           | GitHub Actions                                   |

## Architecture — Keep It Simple
- **No repository layer** — services (`routes/`) query Drizzle directly.
- **Flat src/ layout** — `env.ts`, `db.ts`, `redis.ts`, `auth.ts` all at `src/`.
- **Zod as the single source of truth for types** — define in `packages/shared`, infer with `z.infer<>`.
- **Routes = validate → query → respond** — no indirection.

## Domain Model
```
User ──< user_roles >── Role ──< role_permissions >── Permission
```
- Permissions: `{ resource, action }` pairs e.g. `{ resource: "users", action: "read" }`

## API Base Path: `/api/v1`
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Register user |
| POST | /auth/login | Login → JWT |
| POST | /auth/refresh | Refresh access token |
| POST | /auth/logout | Revoke token |
| GET/POST/PATCH/DELETE | /users | CRUD users |
| POST/DELETE | /users/:id/roles | Assign/revoke roles |
| GET/POST/PATCH/DELETE | /roles | CRUD roles |
| POST/DELETE | /roles/:id/permissions | Assign/revoke permissions |
| GET/POST/PATCH/DELETE | /permissions | CRUD permissions |
| POST | /authz/check | Check `{userId, resource, action}` |

## Key Files
| File | Purpose |
|------|---------|
| `apps/api/src/env.ts` | Zod env validation (Bun.env) |
| `apps/api/src/db.ts` | Drizzle schema + client (all in one) |
| `apps/api/src/redis.ts` | Redis client |
| `apps/api/src/auth.ts` | JWT sign/verify + bearer middleware |
| `apps/api/src/app.ts` | Hono factory, mounts all routes |
| `apps/api/src/index.ts` | Bun server entry |
| `apps/api/src/routes/*.ts` | Route handlers |
| `apps/api/drizzle.config.ts` | Drizzle Kit config |
| `apps/web/src/api/client.ts` | Axios client + JWT interceptor |
| `apps/web/src/stores/auth.store.ts` | Pinia auth store |
| `packages/shared/src/index.ts` | All Zod schemas + inferred types |
| `cue/schema/*.cue` | CUE entity schemas (visualization) |

## Code Patterns

### Hono route (validate → Drizzle → respond)
```typescript
router.post('/', zValidator('json', CreateRoleSchema), async (c) => {
  const dto = c.req.valid('json')                     // typed via Zod
  const [role] = await db.insert(roles).values(dto).returning()
  return c.json({ data: role }, 201)
})
```

### Drizzle query
```typescript
import { db, users } from '../db'
import { eq, isNull, and } from 'drizzle-orm'

const user = await db.query.users.findFirst({
  where: and(eq(users.id, id), isNull(users.deletedAt)),
  columns: { passwordHash: false },
})
```

### Zod schema (packages/shared)
```typescript
export const CreateRoleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
})
export type CreateRoleDto = z.infer<typeof CreateRoleSchema>
```

## Development Workflow
1. `make init` — first-time bootstrap
2. `make dev` — start all services
3. Pick ONE `"failing"` feature from `feature_list.json`
4. Implement + test + mark `"passing"` + commit
5. Update `copilot-progress.txt`

## Commands
| Command | Description |
|---------|-------------|
| `make dev` | Start everything |
| `make dev-api` | API only (hot reload) |
| `make dev-web` | Web only |
| `make test-api` | Bun tests |
| `make test-web` | Vitest |
| `make db-migrate` | Run Drizzle migrations |
| `make db-studio` | Open Drizzle Studio |
| `make cue-vet` | Validate CUE schemas |

## Do Not
- Do not add unnecessary abstraction layers (no repositories, no DI containers)
- Do not use `any` — use `z.infer<>` or `unknown`
- Do not call DB directly in routes — keep Drizzle calls in route handlers, not inline in business logic
- Do not duplicate types — always import from `@rbac/shared`
- Do not commit `.env` files
