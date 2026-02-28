#!/usr/bin/env bash
# init.sh — One-command bootstrap for rbac-service
# Usage: bash init.sh
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[0;33m'; BOLD='\033[1m'; RESET='\033[0m'
info() { echo -e "${BOLD}[init]${RESET} $*"; }
ok()   { echo -e "${GREEN}[ok]${RESET}   $*"; }
warn() { echo -e "${YELLOW}[warn]${RESET} $*"; }

info "rbac-service bootstrap starting..."

# 1. Prerequisites
for cmd in bun docker; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: '$cmd' is required but not installed." >&2; exit 1
  fi
done
BUN_VER=$(bun --version)
ok "Bun $BUN_VER · Docker $(docker --version | awk '{print $3}' | tr -d ',')"

# 2. Install dependencies
info "Installing dependencies..."
bun install
ok "Dependencies installed"

# 3. Copy .env files
for dir in apps/api apps/web; do
  if [ -f "$dir/.env.example" ] && [ ! -f "$dir/.env" ]; then
    cp "$dir/.env.example" "$dir/.env"
    ok "Created $dir/.env from .env.example"
  fi
done

# Load .env for subsequent commands
if [ -f "apps/api/.env" ]; then
  export $(grep -v '^#' apps/api/.env | xargs)
fi

# 4. Start infrastructure
info "Starting PostgreSQL and Redis..."
docker compose up -d postgres redis
info "Waiting for PostgreSQL to be ready..."
until docker compose exec -T postgres pg_isready -U rbac &>/dev/null; do sleep 1; done
ok "PostgreSQL ready"

# 5. Drizzle migrations
info "Generating and applying Drizzle migrations..."
(cd apps/api && bunx drizzle-kit generate && bunx drizzle-kit migrate)
ok "Migrations applied"

# 6. Seed database
info "Seeding database..."
(cd apps/api && bun run db:seed) || warn "Seed not yet implemented — skipping"

# 7. Validate CUE schemas
if command -v cue &>/dev/null; then
  info "Validating CUE schemas..."
  cue vet ./cue/... && ok "CUE schemas valid"
else
  warn "cue not found — skipping (install: https://cuelang.org/docs/install/)"
fi

echo ""
echo -e "${GREEN}${BOLD}✅ rbac-service is ready!${RESET}"
echo ""
echo "  Start everything:  make dev"
echo "  API only:          make dev-api   → http://localhost:3000/api/v1"
echo "  Web only:          make dev-web   → http://localhost:8080"
echo "  Drizzle Studio:    make db-studio → http://localhost:4983"
echo ""
echo "  Next: read copilot-progress.txt and feature_list.json"
