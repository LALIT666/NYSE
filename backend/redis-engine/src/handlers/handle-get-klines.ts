import { AVAILABLE_MARKETS } from "../config/market.config";
import { pgPool } from "../postgres/postgres.pool";
import type { EngineResponse } from "../types/engine-response.types";
import type { IncomingMessage } from "../types/incoming-message.types";
import type { Kline, KlineInterval } from "../types/kline.types";

export const handleGetKlines = async (
  data: Extract<IncomingMessage, { type: "GET_KLINES" }>["data"],
): Promise<EngineResponse> => {
  const { market, interval, startTime, endTime, limit = 100 } = data;

  if (!AVAILABLE_MARKETS.includes(market)) {
    return { ok: false, message: "Invalid market" };
  }

  // Table name interval ke hisab se
  const tableMap: Record<KlineInterval, string> = {
    "1m": "klines_1m",
    "5m": "klines_5m",
    "1h": "klines_1h",
    "1d": "klines_1d",
  };

  const table = tableMap[interval];
  if (!table) return { ok: false, message: "Invalid interval" };

  // Query banao
  const conditions: string[] = ["market = $1"];
  const params: (string | number)[] = [market];
  let idx = 2;

  if (startTime) {
    conditions.push(`bucket >= $${idx++}`);
    params.push(startTime);
  }
  if (endTime) {
    conditions.push(`bucket <= $${idx++}`);
    params.push(endTime);
  }

  const query = `
    SELECT bucket, open, high, low, close, volume, trade_count
    FROM ${table}
    WHERE ${conditions.join(" AND ")}
    ORDER BY bucket DESC
    LIMIT $${idx}
  `;
  params.push(limit);

  try {
    const result = await pgPool.query<Kline>(query, params);
    return {
      ok: true,
      data: {
        market,
        interval,
        klines: result.rows.reverse(), // chronological order
      },
    };
  } catch (err) {
    console.error("Klines query error:", err);
    return { ok: false, message: "Database query failed" };
  }
};
