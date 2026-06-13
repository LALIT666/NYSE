import { balances } from "../data/in-memory-database";
import type { Asset, Balance, UserBalance } from "../types-interfaces/types";

export const initBalance = (userId: string): UserBalance => {
  const userBalance: UserBalance = {
    userId,

    assets: new Map<Asset, Balance>([
      ["INR", { available: 0, locked: 0 }],

      ["TATA", { available: 0, locked: 0 }],

      ["PAYTM", { available: 0, locked: 0 }],

      ["ZOMATO", { available: 0, locked: 0 }],
    ]),
  };

  balances.set(userId, userBalance);

  return userBalance;
};
