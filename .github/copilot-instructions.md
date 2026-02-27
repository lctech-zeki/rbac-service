# GitHub Copilot Instructions — rbac-service

## Project Overview
This is a **Role-Based Access Control (RBAC) microservice** monorepo with a full-stack TypeScript architecture.

## Monorepo Structure
```
rbac-service/
├── apps/
│   ├── api/        # NestJS backend — REST API + business logic
│   └── web/        # Vue 3 frontend — admin dashboard
├── packages/
│   └── shared/     # Shared TypeScript types used by both apps
├── cue/            # CUE language schemas for config & data model visualization
├── feature_list.json    # Incremental feature tracking (agent harness)
└── copilot-progress.txt # Session handoff log
```

## Tech Stack
| Layer       | Technology                          |
|-------------|-------------------------------------|
| Backend     | NestJS (TypeScript), Prisma, JWT    |
| Frontend    | Vue 3, Vite, Pinia, Vue Router      |
| Database    | PostgreSQL (via Prisma ORM)         |
| Cache       | Redis (ioredis)                     |
| Schema vis  | CUE (cuelang.org)                   |
| Testing     | Jest (API), Vitest (Web)            |
| Package mgr | pnpm workspaces                     |

## Architecture Principles
1. **Clean Architecture**: domain → service → handler, no cross-layer imports.
2. **Shared types**: All API request/response types live in `packages/shared/src/types/`.
   Always import from `@rbac/shared` — never duplicate type definitions.
3. **Dependency Injection**: Use NestJS `@Injectable()` + constructor injection in the API.
4. **Repository Pattern**: Services depend on repository *interfaces* (`domain/interfaces/`),
   not concrete implementations.
5. **CUE as truth**: Domain entity shapes are defined in `cue/schema/*.cue`.
   TypeScript types in `packages/shared` must stay consistent with CUE schemas.

## Naming Conventions
- Files: `kebab-case.ts` (e.g., `user.service.ts`)
- Classes: `PascalCase` (e.g., `UsersService`)
- Interfaces: `I` prefix (e.g., `IUserRepository`)
- DTOs: suffix with `Dto` (e.g., `CreateUserDto`)
- Entities (Prisma): suffix with `Entity` only for domain wrappers; Prisma models are plain names
- Vue components: `PascalCase.vue` (e.g., `UserTable.vue`)
- Pinia stores: `use<Name>Store` (e.g., `useUsersStore`)
- Composables: `use<Name>` (e.g., `useAuth`)

## API Conventions
- Base path: `/api/v1`
- Auth: Bearer JWT in `Authorization` header
- Responses always wrap data: `{ data: T, meta?: PaginationMeta }`
- Errors follow RFC 7807 Problem Details format
- Pagination: `?page=1&limit=20` query params

## Domain Model
```
User ──< UserRole >── Role ──< RolePermission >── Permission
```
- A **User** can have many **Roles**
- A **Role** can have many **Permissions**
- A **Permission** is `{ resource: string, action: string }` (e.g., `users:read`)

## Key Files to Know
- `apps/api/src/app.module.ts` — NestJS root module
- `apps/api/src/modules/auth/jwt.strategy.ts` — JWT validation
- `apps/api/src/common/guards/jwt-auth.guard.ts` — route protection
- `apps/api/src/common/guards/permissions.guard.ts` — permission check
- `apps/api/prisma/schema.prisma` — database schema
- `apps/web/src/router/index.ts` — Vue Router with auth guards
- `apps/web/src/stores/auth.store.ts` — Pinia auth store
- `packages/shared/src/types/index.ts` — shared types

## Development Workflow
1. Run `make init` once for first-time setup
2. Run `make dev` to start all services
3. Pick one feature from `feature_list.json` (status: "failing")
4. Implement it, write tests, mark it "passing"
5. Commit with `feat(<scope>): <description>` conventional commit format
6. Update `copilot-progress.txt` with what was done

## Testing
- **API unit tests**: `pnpm --filter api run test`
- **API e2e tests**: `pnpm --filter api run test:e2e`
- **Web tests**: `pnpm --filter web run test`
- Mocks: Use `jest.mock()` for services; never mock domain entities
- Test files: co-located `*.spec.ts` for unit, `test/*.e2e-spec.ts` for e2e

## Do Not
- Do not import from `../../` more than 2 levels — use workspace aliases instead
- Do not put business logic in controllers/handlers — keep it in services
- Do not bypass repository interfaces by calling Prisma directly in services
- Do not commit `.env` files — use `.env.example` as template
- Do not add `any` types without a TODO comment explaining why
