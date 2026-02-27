#!/usr/bin/env bash
# init.sh — One-command bootstrap for rbac-service
# Usage: bash init.sh
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RESET='\033[0m'

info()  { echo -e "${BOLD}[init]${RESET} $*"; }
ok()    { echo -e "${GREEN}[ok]${RESET}   $*"; }
warn()  { echo -e "${YELLOW}[warn]${RESET} $*"; }

info "rbac-service bootstrap starting..."

# 1. Check prerequisites
for cmd in node pnpm docker; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: '$cmd' is required but not installed." >&2
    exit 1
  fi
done

NODE_VER=$(node --version | sed 's/v//')
MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
if [ "$MAJOR" -lt 20 ]; then
  warn "Node.js 20+ recommended (found v$NODE_VER)"
fi
ok "Prerequisites OK"

# 2. Install dependencies
info "Installing dependencies with pnpm..."
pnpm install
ok "Dependencies installed"

# 3. Copy .env files if they don't exist
for dir in apps/api apps/web; do
  if [ -f "$dir/.env.example" ] && [ ! -f "$dir/.env" ]; then
    cp "$dir/.env.example" "$dir/.env"
    ok "Created $dir/.env from .env.example"
  fi
done

# 4. Start infrastructure services
info "Starting PostgreSQL and Redis..."
docker compose up -d postgres redis

info "Waiting for postgres to be healthy..."
until docker compose exec -T postgres pg_isready -U rbac &>/dev/null; do
  sleep 1
done
ok "PostgreSQL is ready"

# 5. Run Prisma migrations
info "Running database migrations..."
pnpm --filter api run db:migrate
ok "Migrations applied"

# 6. Seed database
info "Seeding database..."
pnpm --filter api run db:seed || warn "Seed script not yet implemented — skipping"

# 7. Validate CUE schemas
if command -v cue &>/dev/null; then
  info "Validating CUE schemas..."
  cue vet ./cue/... && ok "CUE schemas valid"
else
  warn "cue CLI not found — skipping CUE validation (install from https://cuelang.org/docs/install/)"
fi

echo ""
echo -e "${GREEN}${BOLD}✅ rbac-service is ready!${RESET}"
echo ""
echo "  Start all services:  make dev"
echo "  API only:            make dev-api   → http://localhost:3000"
echo "  Web only:            make dev-web   → http://localhost:8080"
echo "  Prisma Studio:       make db-studio → http://localhost:5555"
echo "  API docs:            http://localhost:3000/api/docs"
echo ""
echo "  Next step: read copilot-progress.txt and feature_list.json"
