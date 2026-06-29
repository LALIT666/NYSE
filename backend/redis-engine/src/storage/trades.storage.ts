// Trades ka in-memory storage

import type { Market } from "../types/order.types";
import type { Trade } from "../types/trade.types";
import { AVAILABLE_MARKETS } from "../config/market.config";

// System ke saare trades ek array me
export const trades: Trade[] = [];

// Market wise trades alag alag
// Taaki market specific data fast mile
export const marketTrades = new Map<Market, Trade[]>();

// Har market ke liye khali array initialize karo
// Warna pehle trade se pehle .get() undefined dega aur crash hoga
AVAILABLE_MARKETS.forEach((m) => marketTrades.set(m, []));
