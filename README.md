# rbac-service

> Role-Based Access Control microservice — simple, fast, production-ready.

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | **Bun 3** |
| API | **Hono 4.12** |
| Validation | **Zod 4** |
| ORM | **Drizzle ORM 0.44** |
| Database | PostgreSQL 17 |
| Cache | Redis 7 (ioredis 5) |
| Frontend | **Vue 3.5** + Vite 7 + Pinia 3 + Vue Router 5 |
| Styling | **Tailwind CSS v4** |
| Schema vis | **CUE** |

## Monorepo

```
apps/
  api/      ← Hono REST API (Bun runtime)
  web/      ← Vue 3 admin dashboard
packages/
  shared/   ← Zod schemas + inferred TypeScript types
cue/        ← CUE schemas for data model visualization
```

## Quick Start

**Prerequisites:** [Bun ≥ 1.1](https://bun.sh), [Docker](https://docker.com)

```bash
# Clone and bootstrap
git clone https://github.com/lctech-zeki/rbac-service
cd rbac-service
bash init.sh

# Start all services
make dev
```

- API: http://localhost:3000/api/v1
- Web: http://localhost:8080
- Health: http://localhost:3000/api/v1/healthz
- Drizzle Studio: `make db-studio` → http://localhost:4983

## Domain Model

```
User ──< user_roles >── Role ──< role_permissions >── Permission
```

A **Permission** is a `{ resource, action }` pair (e.g. `users:read`).

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | — | Register |
| POST | `/api/v1/auth/login` | — | Login → JWT |
| POST | `/api/v1/auth/refresh` | — | Refresh token |
| POST | `/api/v1/auth/logout` | ✓ | Revoke token |
| GET | `/api/v1/users` | ✓ | List users |
| POST | `/api/v1/users` | ✓ | Create user |
| GET | `/api/v1/users/:id` | ✓ | Get user |
| PATCH | `/api/v1/users/:id` | ✓ | Update user |
| DELETE | `/api/v1/users/:id` | ✓ | Soft-delete user |
| POST | `/api/v1/users/:id/roles` | ✓ | Assign role |
| DELETE | `/api/v1/users/:id/roles/:roleId` | ✓ | Revoke role |
| GET/POST/PATCH/DELETE | `/api/v1/roles` | ✓ | CRUD roles |
| POST/DELETE | `/api/v1/roles/:id/permissions` | ✓ | Assign/revoke permissions |
| GET/POST/PATCH/DELETE | `/api/v1/permissions` | ✓ | CRUD permissions |
| POST | `/api/v1/authz/check` | ✓ | Check permission |
| GET | `/api/v1/authz/users/:id/permissions` | ✓ | Get user permissions |

## Development

```bash
make dev-api      # API hot reload
make dev-web      # Web dev server
make test-api     # Bun tests
make test-web     # Vitest
make db-migrate   # Run migrations
make db-studio    # Drizzle Studio
make cue-vet      # Validate CUE schemas
```

## For GitHub Copilot

Read `.github/copilot-instructions.md` for architecture decisions, patterns, and conventions.
Read `copilot-progress.txt` to understand what has been done and what's next.
Pick a `"failing"` feature from `feature_list.json` for the next implementation task.

## Architecture Principles

1. **Simple**: no over-engineering, no DI containers, flat structure
2. **Fast**: Bun runtime + Hono framework (minimal overhead)
3. **Type-safe**: Zod as single source of truth, `z.infer<>` everywhere
4. **Microservice**: single responsibility, stateless, horizontally scalable
