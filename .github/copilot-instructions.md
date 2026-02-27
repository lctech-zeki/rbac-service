# GitHub Copilot Instructions — rbac-service

## Project Overview
A **Role-Based Access Control (RBAC) microservice** monorepo with a full-stack TypeScript architecture.

## Monorepo Structure
```
rbac-service/
├── apps/
│   ├── api/        # Hono backend — REST API (runs on Bun)
│   └── web/        # Vue 3 frontend — admin dashboard
├── packages/
│   └── shared/     # Shared Zod schemas + inferred TS types
├── cue/            # CUE language schemas for config & data model visualization
├── feature_list.json    # Incremental feature tracking (agent harness)
└── copilot-progress.txt # Session handoff log
```

## Tech Stack
| Layer       | Technology                                  |
|-------------|---------------------------------------------|
| Runtime     | **Bun** ≥ 1.1                               |
| Backend     | **Hono** (TypeScript), Prisma, Zod, JWT     |
| Frontend    | **Vue 3**, Vite, Pinia, Vue Router, Zod     |
| Validation  | **Zod** (shared schemas in packages/shared) |
| Database    | PostgreSQL (Prisma ORM)                     |
| Cache       | Redis (ioredis)                             |
| Schema vis  | **CUE** (cuelang.org)                       |
| Testing     | Bun test (API), Vitest (Web)                |
| Package mgr | Bun workspaces                              |

## Architecture Principles
1. **Zod as single source of truth for types**: Define schemas in `packages/shared/src/schemas/`,
   infer TypeScript types with `z.infer<>`. Never write separate `interface` / `type` for API shapes.
2. **Clean layering** (API): `route → service → repository`. Routes only validate + call services.
   Services contain business logic. Repositories contain all Prisma calls.
3. **Shared schemas**: Both API (validation) and Web (form validation, API response parsing)
   import from `@rbac/shared`. Zero type duplication.
4. **CUE mirrors Zod**: Domain entity shapes are also defined in `cue/schema/*.cue` for
   visualization and config validation. Keep them in sync with Zod schemas.
5. **Bun-native**: Use `Bun.env` for env vars, `bun test` for API tests, `Bun.serve` implicitly
   via Hono's default export pattern.

## Naming Conventions
- Files: `kebab-case.ts` / `kebab-case.vue`
- Classes: `PascalCase` (e.g., `UserService`)
- Zod schemas: `<Entity>Schema` (e.g., `CreateUserSchema`)
- Inferred types: `z.infer<typeof CreateUserSchema>` — export as `type CreateUserDto`
- Vue components: `PascalCase.vue` (e.g., `UserTable.vue`)
- Pinia stores: `use<Name>Store` (e.g., `useUsersStore`)
- Composables: `use<Name>` (e.g., `useAuth`)
- Route files: `<resource>.ts` inside `src/routes/`

## API Conventions
- Base path: `/api/v1`
- Auth: Bearer JWT in `Authorization` header
- All responses: `{ data: T, meta?: PaginationMeta }` for success; Problem Details (RFC 7807) for errors
- Validation: use `@hono/zod-validator` with schemas from `@rbac/shared`
- Pagination: `?page=1&limit=20` query params

## Domain Model
```
User ──< UserRole >── Role ──< RolePermission >── Permission
```
- A **User** can have many **Roles**
- A **Role** can have many **Permissions**
- A **Permission** = `{ resource: string, action: string }` (e.g., `"users"`, `"read"`)

## Key Files to Know
| File | Purpose |
|------|---------|
| `apps/api/src/index.ts` | Bun server entry point |
| `apps/api/src/app.ts` | Hono app factory, mounts all routes |
| `apps/api/src/config/env.ts` | Zod env validation (`Bun.env`) |
| `apps/api/src/lib/prisma.ts` | Prisma client singleton |
| `apps/api/src/lib/redis.ts` | Redis client singleton |
| `apps/api/src/middleware/auth.ts` | JWT Bearer middleware |
| `apps/api/src/middleware/permissions.ts` | Permission check middleware |
| `apps/api/src/routes/*.ts` | Hono route handlers |
| `apps/api/src/services/*.ts` | Business logic |
| `apps/api/src/repositories/*.ts` | Prisma data access |
| `apps/api/prisma/schema.prisma` | Database schema |
| `apps/web/src/router/index.ts` | Vue Router (with auth guard) |
| `apps/web/src/stores/auth.store.ts` | Pinia auth store |
| `apps/web/src/api/client.ts` | Typed fetch client |
| `packages/shared/src/schemas/` | Zod schemas (shared) |
| `cue/schema/*.cue` | CUE entity schemas (visualization) |

## Hono Route Pattern
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CreateUserSchema } from '@rbac/shared'

const users = new Hono()

users.post('/', zValidator('json', CreateUserSchema), async (c) => {
  const dto = c.req.valid('json')          // typed via Zod inference
  const user = await userService.create(dto)
  return c.json({ data: user }, 201)
})

export default users
```

## Zod Schema Pattern (packages/shared)
```typescript
import { z } from 'zod'

export const CreateUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
})
export type CreateUserDto = z.infer<typeof CreateUserSchema>
```

## Development Workflow
1. Run `make init` once for first-time setup
2. Run `make dev` to start all services
3. Pick ONE feature from `feature_list.json` with `"status": "failing"`
4. Implement it, write tests, mark it `"passing"`
5. Commit: `feat(<scope>): <description>` (conventional commits)
6. Update `copilot-progress.txt` with what was done and what's next

## Testing
- **API**: `bun test` — files matching `**/*.test.ts` or `**/*.spec.ts`
- **Web**: `bun run --filter web test` (Vitest)
- Mocks: use `mock()` from `bun:test` for API; `vi.mock()` for web
- Never mock Zod schemas — test with real validation

## Do Not
- Do not use `any` — use `z.infer<>` or `unknown` with type guards
- Do not call Prisma directly inside routes — always go through a service
- Do not duplicate types — import from `@rbac/shared`
- Do not commit `.env` files — use `.env.example` as template
- Do not bypass Zod validation on incoming requests
