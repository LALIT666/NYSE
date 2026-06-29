// Ticker: Market ka last 24 ghante ka summary

import type { EngineResponse } from "../types/engine-response.types";
import type { Market } from "../types/order.types";
import { AVAILABLE_MARKETS } from "../config/market.config";
import { marketTrades } from "../storage/trades.storage";

export const handleGetTicker = (data: { market: Market }): EngineResponse => {
  if (!AVAILABLE_MARKETS.includes(data.market)) {
    return { ok: false, message: "Invalid market" };
  }

  // Is market ke saare trades
  const mTrades = marketTrades.get(data.market) ?? [];

  // 24 ghante pehle ka time in milliseconds
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  // Sirf last 24 ghante ke trades filter karo
  const last24h = mTrades.filter((t) => t.timestamp.getTime() > cutoff);

  // Saari prices nikalo
  const prices = last24h.map((t) => t.price);

  // Total volume = saari quantities ka sum
  const volume = last24h.reduce((acc, t) => acc + t.quantity, 0);

  return {
    ok: true,
    data: {
      market: data.market,
      // Sabse aakhri trade ki price
      lastPrice: mTrades.length ? mTrades[mTrades.length - 1]!.price : 0,
      // 24h ki sabse mehengi price
      high24h: prices.length ? Math.max(...prices) : 0,
      // 24h ki sabse sasti price
      low24h: prices.length ? Math.min(...prices) : 0,
      // 24h me total kitna trade hua
      volume24h: volume,
      // 24h me price kitni change hui
      priceChange24h:
        prices.length > 1 ? prices[prices.length - 1]! - prices[0]! : 0,
    },
  };
};
