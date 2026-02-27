FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lockb* ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN bun install --frozen-lockfile
RUN bun run --filter api build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules

USER bun
EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
