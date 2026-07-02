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