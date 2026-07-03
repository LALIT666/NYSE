FROM oven/bun:1.1-alpine AS base
WORKDIR /app

# ============ Dependencies stage ============
FROM base AS deps
# Copy db package first (workspace dependency)
COPY db/package.json ./db/
COPY db/prisma ./db/prisma
COPY db/src ./db/src

# Install db deps + generate Prisma client
WORKDIR /app/db
RUN bun install
RUN bunx prisma generate

# Copy httpserver
WORKDIR /app/httpserver
COPY httpserver/package.json ./
RUN bun install

# ============ Production stage ============
FROM base AS runner
WORKDIR /app

# Copy db (with generated Prisma client)
COPY --from=deps /app/db ./db

# Copy httpserver deps + source
COPY --from=deps /app/httpserver/node_modules ./httpserver/node_modules
COPY httpserver/package.json ./httpserver/
COPY httpserver/tsconfig.json ./httpserver/
COPY httpserver/src ./httpserver/src

WORKDIR /app/httpserver

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]