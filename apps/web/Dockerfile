FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lockb* ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN bun install --frozen-lockfile
RUN bun run --filter web build

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
