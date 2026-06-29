// Market se related configurations

import type { Asset } from "../types/balance.types";
import type { Market } from "../types/order.types";

// Kaunse markets available hai hamare system me
export const AVAILABLE_MARKETS: Market[] = [
  "TATA_INR",
  "PAYTM_INR",
  "ZOMATO_INR",
];

// Har market me base aur quote asset kya hai
// Base = jo kharid/bech rahe ho (TATA stock)
// Quote = jisse pay kar rahe ho (INR)
export const marketAssets: Record<Market, { base: Asset; quote: Asset }> = {
  TATA_INR: { base: "TATA", quote: "INR" },
  PAYTM_INR: { base: "PAYTM", quote: "INR" },
  ZOMATO_INR: { base: "ZOMATO", quote: "INR" },
};
