FROM oven/bun:1.1-alpine AS base
WORKDIR /app

FROM base AS deps
COPY backend/httpserver/package.json ./backend/httpserver/
WORKDIR /app/backend/httpserver
RUN bun install

FROM base AS runner
WORKDIR /app

COPY --from=deps /app/backend/httpserver/node_modules ./backend/httpserver/node_modules
COPY backend/httpserver/package.json ./backend/httpserver/
COPY backend/httpserver/tsconfig.json ./backend/httpserver/
COPY backend/httpserver/src ./backend/httpserver/src

WORKDIR /app/backend/httpserver

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]