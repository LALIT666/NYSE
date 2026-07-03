FROM oven/bun:1.1-alpine AS base
WORKDIR /app

FROM base AS deps
COPY backend/db ./backend/db
COPY backend/redis-engine/package.json ./backend/redis-engine/

WORKDIR /app/backend/db
RUN bun install
RUN bunx prisma generate

WORKDIR /app/backend/redis-engine
RUN bun install

FROM base AS runner
WORKDIR /app

COPY --from=deps /app/backend/db ./backend/db
COPY --from=deps /app/backend/redis-engine/node_modules ./backend/redis-engine/node_modules
COPY backend/redis-engine/package.json ./backend/redis-engine/
COPY backend/redis-engine/tsconfig.json ./backend/redis-engine/
COPY backend/redis-engine/src ./backend/redis-engine/src

WORKDIR /app/backend/redis-engine

CMD ["bun", "run", "src/index.ts"]