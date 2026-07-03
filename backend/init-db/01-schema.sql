-- TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ==================== TRADES TABLE ====================
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