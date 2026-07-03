FROM oven/bun:1.1-alpine AS base
WORKDIR /app

FROM base AS deps
COPY backend/ws-server/package.json ./backend/ws-server/
WORKDIR /app/backend/ws-server
RUN bun install

FROM base AS runner
WORKDIR /app

COPY --from=deps /app/backend/ws-server/node_modules ./backend/ws-server/node_modules
COPY backend/ws-server/package.json ./backend/ws-server/
COPY backend/ws-server/tsconfig.json ./backend/ws-server/
COPY backend/ws-server/src ./backend/ws-server/src

WORKDIR /app/backend/ws-server

EXPOSE 3001

CMD ["bun", "run", "src/index.ts"]