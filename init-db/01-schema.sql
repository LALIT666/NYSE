-- ==================== TimescaleDB Extension ====================
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ==================== ENUMS ====================
DO $$ BEGIN
  CREATE TYPE "OrderKind" AS ENUM ('buy', 'sell');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "OrderType" AS ENUM ('limit', 'market');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('pending', 'partial', 'filled', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "Market" AS ENUM ('TATA_INR', 'PAYTM_INR', 'ZOMATO_INR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "Asset" AS ENUM ('INR', 'TATA', 'PAYTM', 'ZOMATO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS "users" (
  "userId"       TEXT PRIMARY KEY,
  "email"        TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== ORDERS TABLE ====================
CREATE TABLE IF NOT EXISTS "orders" (
  "orderId"        TEXT PRIMARY KEY,
  "userId"         TEXT NOT NULL,
  "kind"           "OrderKind" NOT NULL,
  "type"           "OrderType" NOT NULL,
  "price"          DOUBLE PRECISION NOT NULL,
  "quantity"       DOUBLE PRECISION NOT NULL,
  "filledQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "market"         "Market" NOT NULL,
  "status"         "OrderStatus" NOT NULL DEFAULT 'pending',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "orders_userId_idx" ON "orders"("userId");
CREATE INDEX IF NOT EXISTS "orders_market_status_idx" ON "orders"("market", "status");

-- ==================== BALANCES TABLE ====================
CREATE TABLE IF NOT EXISTS "balances" (
  "id"        SERIAL PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "asset"     "Asset" NOT NULL,
  "available" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "locked"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "balances_userId_asset_key" ON "balances"("userId", "asset");
CREATE INDEX IF NOT EXISTS "balances_userId_idx" ON "balances"("userId");

-- ==================== TRADES TABLE (TimescaleDB) ====================
CREATE TABLE IF NOT EXISTS trades (
  trade_id    TEXT NOT NULL,
  market      TEXT NOT NULL,
  price       DOUBLE PRECISION NOT NULL,
  quantity    DOUBLE PRECISION NOT NULL,
  buyer_id    TEXT NOT NULL,
  seller_id   TEXT NOT NULL,
  buy_order   TEXT NOT NULL,
  sell_order  TEXT NOT NULL,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT create_hypertable('trades', 'timestamp', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_trades_market_time
  ON trades (market, timestamp DESC);

-- ==================== CONTINUOUS AGGREGATES ====================
CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1m
WITH (timescaledb.continuous) AS
SELECT
  market,
  time_bucket('1 minute', timestamp) AS bucket,
  first(price, timestamp)  AS open,
  max(price)               AS high,
  min(price)               AS low,
  last(price, timestamp)   AS close,
  sum(quantity)            AS volume,
  count(*)                 AS trade_count
FROM trades
GROUP BY market, bucket
WITH NO DATA;

CREATE MATERIALIZED VIEW IF NOT EXISTS klines_5m
WITH (timescaledb.continuous) AS
SELECT
  market,
  time_bucket('5 minutes', timestamp) AS bucket,
  first(price, timestamp)  AS open,
  max(price)               AS high,
  min(price)               AS low,
  last(price, timestamp)   AS close,
  sum(quantity)            AS volume,
  count(*)                 AS trade_count
FROM trades
GROUP BY market, bucket
WITH NO DATA;

CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1h
WITH (timescaledb.continuous) AS
SELECT
  market,
  time_bucket('1 hour', timestamp) AS bucket,
  first(price, timestamp)  AS open,
  max(price)               AS high,
  min(price)               AS low,
  last(price, timestamp)   AS close,
  sum(quantity)            AS volume,
  count(*)                 AS trade_count
FROM trades
GROUP BY market, bucket
WITH NO DATA;

CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1d
WITH (timescaledb.continuous) AS
SELECT
  market,
  time_bucket('1 day', timestamp) AS bucket,
  first(price, timestamp)  AS open,
  max(price)               AS high,
  min(price)               AS low,
  last(price, timestamp)   AS close,
  sum(quantity)            AS volume,
  count(*)                 AS trade_count
FROM trades
GROUP BY market, bucket
WITH NO DATA;

-- ==================== REFRESH POLICIES ====================
SELECT add_continuous_aggregate_policy('klines_1m',
  start_offset => INTERVAL '1 hour',
  end_offset   => INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute',
  if_not_exists => TRUE);

SELECT add_continuous_aggregate_policy('klines_5m',
  start_offset => INTERVAL '6 hours',
  end_offset   => INTERVAL '5 minutes',
  schedule_interval => INTERVAL '5 minutes',
  if_not_exists => TRUE);

SELECT add_continuous_aggregate_policy('klines_1h',
  start_offset => INTERVAL '7 days',
  end_offset   => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE);

SELECT add_continuous_aggregate_policy('klines_1d',
  start_offset => INTERVAL '30 days',
  end_offset   => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day',
  if_not_exists => TRUE);