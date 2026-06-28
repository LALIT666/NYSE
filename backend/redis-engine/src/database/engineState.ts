import type { Order, UserBalance, Trade, Market, Asset } from "../types/types";

// ==================== ENGINE STATE (in-memory) ====================
export const orders = new Map<string, Order>(); // orderId → Order
export const userOrders = new Map<string, Set<string>>(); // userId → Set<orderId>
export const balances = new Map<string, UserBalance>(); // userId → UserBalance
export const trades: Trade[] = []; // saare trades
export const marketTrades = new Map<Market, Trade[]>(); // market wise

export const AVAILABLE_MARKETS: Market[] = [
  "TATA_INR",
  "PAYTM_INR",
  "ZOMATO_INR",
];

export const marketAssets: Record<Market, { base: Asset; quote: Asset }> = {
  TATA_INR: { base: "TATA", quote: "INR" },
  PAYTM_INR: { base: "PAYTM", quote: "INR" },
  ZOMATO_INR: { base: "ZOMATO", quote: "INR" },
};

// Initialize empty market trades

AVAILABLE_MARKETS.forEach((m) => marketTrades.set(m, []));
