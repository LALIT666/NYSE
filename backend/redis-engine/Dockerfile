FROM oven/bun:1.1-alpine AS base
WORKDIR /app

FROM base AS deps
COPY backend/db ./backend/db
COPY backend/http-server/package.json ./backend/http-server/
WORKDIR /app/backend/http-server
RUN bun install

FROM base AS runner
WORKDIR /app

COPY --from=deps /app/backend/db ./backend/db
COPY --from=deps /app/backend/http-server/node_modules ./backend/http-server/node_modules
COPY backend/http-server/package.json ./backend/http-server/
COPY backend/http-server/tsconfig.json ./backend/http-server/
COPY backend/http-server/src ./backend/http-server/src

WORKDIR /app/backend/http-server

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]