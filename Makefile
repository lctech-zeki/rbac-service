.PHONY: help install dev build test test-api test-web test-coverage lint typecheck \
        db-up db-down db-migrate db-seed cue-vet docker-build

DOCKER_COMPOSE = docker compose
BUN = bun

help: ## Show this help
@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
$(BUN) install

dev: ## Start all services in development mode
$(DOCKER_COMPOSE) up -d postgres redis
$(BUN) run dev

dev-api: ## Start only the API (hot reload via Bun)
$(DOCKER_COMPOSE) up -d postgres redis
$(BUN) run --filter api dev

dev-web: ## Start only the Vue 3 web app
$(BUN) run --filter web dev

build: ## Build all packages
$(BUN) run build

test: ## Run all tests (no coverage threshold)
$(BUN) run test

test-api: ## Run API tests (Bun test runner)
$(BUN) run --filter api test

test-web: ## Run web tests (Vitest)
$(BUN) run --filter web test

test-coverage: ## Run all tests with coverage — enforces ≥70% threshold
$(BUN) run test:coverage

test-coverage-api: ## Run API tests with coverage
$(BUN) run --filter api test:coverage

test-coverage-web: ## Run web tests with coverage
$(BUN) run --filter web test:coverage

lint: ## Lint all source code with oxlint
$(BUN) run lint

typecheck: ## Type-check all packages
$(BUN) run typecheck

db-up: ## Start database services
$(DOCKER_COMPOSE) up -d postgres redis

db-down: ## Stop database services
$(DOCKER_COMPOSE) down

db-migrate: ## Run Drizzle migrations
$(BUN) run --filter api db:migrate

db-seed: ## Seed the database
$(BUN) run --filter api db:seed

db-studio: ## Open Drizzle Studio
$(BUN) run --filter api db:studio

cue-vet: ## Validate CUE schemas
cue vet ./cue/...

cue-export: ## Export CUE schemas to JSON
cue export ./cue/schema/... -o docs/schema.json

docker-build: ## Build Docker images
docker build -f apps/api/Dockerfile -t rbac-api:latest .
docker build -f apps/web/Dockerfile -t rbac-web:latest .

init: install db-up db-migrate db-seed ## Full project initialisation
@echo "✅ rbac-service is ready. Run 'make dev' to start."
