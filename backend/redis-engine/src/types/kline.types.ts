export type KlineInterval = "1m" | "5m" | "1h" | "1d";

export interface Kline {
  bucket: string; // ISO timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trade_count: number;
}
