import { balances } from "../database/engineState";
import type { Asset, Balance, UserBalance } from "../types/types";

// ==================== HELPERS ====================
export const initBalance = (userId: string): UserBalance => {
  const ub: UserBalance = {
    userId,
    assets: new Map<Asset, Balance>([
      ["INR", { available: 0, locked: 0 }],
      ["TATA", { available: 0, locked: 0 }],
      ["PAYTM", { available: 0, locked: 0 }],
      ["ZOMATO", { available: 0, locked: 0 }],
    ]),
  };
  balances.set(userId, ub);
  return ub;
};

export const getBalance = (userId: string): UserBalance => {
  return balances.get(userId) ?? initBalance(userId);
};

export const serializeBalance = (ub: UserBalance): Record<string, Balance> => {
  const obj: Record<string, Balance> = {};
  ub.assets.forEach((bal, asset) => {
    obj[asset] = bal;
  });
  return obj;
};
