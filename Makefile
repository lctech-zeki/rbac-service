.PHONY: help install dev build test lint format db-up db-down db-migrate db-seed cue-vet docker-build

DOCKER_COMPOSE = docker compose
PNPM = pnpm

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	$(PNPM) install

dev: ## Start all services in development mode
	$(DOCKER_COMPOSE) up -d postgres redis
	$(PNPM) dev

dev-api: ## Start only the API in development mode
	$(DOCKER_COMPOSE) up -d postgres redis
	$(PNPM) --filter api run dev

dev-web: ## Start only the web app in development mode
	$(PNPM) --filter web run dev

build: ## Build all packages
	$(PNPM) build

test: ## Run all tests
	$(PNPM) test

test-api: ## Run API tests
	$(PNPM) --filter api run test

test-web: ## Run web tests
	$(PNPM) --filter web run test

lint: ## Lint all packages
	$(PNPM) lint

format: ## Format all packages
	$(PNPM) format

typecheck: ## Type-check all packages
	$(PNPM) typecheck

db-up: ## Start database services
	$(DOCKER_COMPOSE) up -d postgres redis

db-down: ## Stop database services
	$(DOCKER_COMPOSE) down

db-migrate: ## Run database migrations
	$(PNPM) --filter api run db:migrate

db-seed: ## Seed the database
	$(PNPM) --filter api run db:seed

db-studio: ## Open Prisma Studio
	$(PNPM) --filter api run db:studio

cue-vet: ## Validate CUE schemas
	cue vet ./cue/...

cue-export: ## Export CUE schemas to JSON
	cue export ./cue/schema/... -o docs/schema.json

docker-build: ## Build Docker images
	docker build -f apps/api/Dockerfile -t rbac-api:latest apps/api
	docker build -f apps/web/Dockerfile -t rbac-web:latest apps/web

init: install db-up db-migrate db-seed ## Full project initialisation
	@echo "✅ rbac-service is ready. Run 'make dev' to start."
