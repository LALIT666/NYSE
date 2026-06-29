// GET_TRADES: Kisi market ke recent trades

import type { EngineResponse } from "../types/engine-response.types";
import type { Market } from "../types/order.types";
import { AVAILABLE_MARKETS } from "../config/market.config";
import { marketTrades } from "../storage/trades.storage";

export const handleGetTrades = (data: { market: Market }): EngineResponse => {
  if (!AVAILABLE_MARKETS.includes(data.market)) {
    return { ok: false, message: "Invalid market" };
  }

  const mTrades = marketTrades.get(data.market) ?? [];

  // Last 50 trades ulta karke do (naye pehle)
  return {
    ok: true,
    data: { trades: mTrades.slice(-50).reverse() },
  };
};
