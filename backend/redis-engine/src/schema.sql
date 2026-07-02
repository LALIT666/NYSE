CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS trades (
  trade_id    TEXT NOT NULL,                 -- trade ki unique id
  market      TEXT NOT NULL,                 -- jaise TATA_INR
  price       DOUBLE PRECISION NOT NULL,     -- kis price pe trade hua
  quantity    DOUBLE PRECISION NOT NULL,     -- kitna trade hua
  buyer_id    TEXT NOT NULL,                 -- buyer ka user id
  seller_id   TEXT NOT NULL,                 -- seller ka user id
  buy_order   TEXT NOT NULL,                 -- buy order id
  sell_order  TEXT NOT NULL,                 -- sell order id
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW() -- trade kab hua
);


SELECT create_hypertable(
  'trades',
  'timestamp',
  if_not_exists => TRUE
);


CREATE INDEX IF NOT EXISTS idx_trades_market_time
  ON trades (market, timestamp DESC);



CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1m
WITH (timescaledb.continuous) AS
SELECT
  market,                                           -- kaunsa market
  time_bucket('1 minute', timestamp) AS bucket,     -- 1 minute ka bucket
  first(price, timestamp)  AS open,                 -- us minute ki first price
  max(price)               AS high,                 -- us minute ki highest price
  min(price)               AS low,                  -- us minute ki lowest price
  last(price, timestamp)   AS close,                -- us minute ki last price
  sum(quantity)            AS volume,               -- us minute ka total traded qty
  count(*)                 AS trade_count           -- us minute me kitne trades hue
FROM trades
GROUP BY market, bucket
WITH NO DATA;



SELECT add_continuous_aggregate_policy(
  'klines_1m',
  start_offset => INTERVAL '1 hour',
  end_offset   => INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute',
  if_not_exists => TRUE
);


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



SELECT add_continuous_aggregate_policy(
  'klines_5m',
  start_offset => INTERVAL '6 hours',
  end_offset   => INTERVAL '5 minutes',
  schedule_interval => INTERVAL '5 minutes',
  if_not_exists => TRUE
);


