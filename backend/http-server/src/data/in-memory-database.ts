import type {
  Asset,
  Market,
  Order,
  User,
  UserBalance,
} from "../types-interfaces/types";

export const users = new Map<string, User>();

export const usersById = new Map<string, User>();

export const balances = new Map<string, UserBalance>();

// marketAssets: Har market ke liye base aur quote asset kya hai
// Base asset  = jo cheez kharid/bech rahe ho (TATA, PAYTM, ZOMATO)
// Quote asset = jis cheez se pay kar rahe ho (INR)
// Example: TATA_INR me TATA kharid rahe ho INR dekar
export const marketAssets: Record<Market, { base: Asset; quote: Asset }> = {
  TATA_INR: { base: "TATA", quote: "INR" },

  PAYTM_INR: { base: "PAYTM", quote: "INR" },

  ZOMATO_INR: { base: "ZOMATO", quote: "INR" },
};

export const orders = new Map<string, Order>();

export const userOrders = new Map<string, Set<string>>();
