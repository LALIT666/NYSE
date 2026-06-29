import type { EngineResponse } from "../types/engine-response.types";
import type { Market } from "../types/order.types";
import { AVAILABLE_MARKETS } from "../config/market.config";
import { computeDepth } from "../helpers/compute-depth.helper";

export const handleGetDepth = (data: { market: Market }): EngineResponse => {
  // Check karo market valid hai ya nahi
  if (!AVAILABLE_MARKETS.includes(data.market)) {
    return { ok: false, message: "Invalid market" };
  }

  return { ok: true, data: computeDepth(data.market) };
};
