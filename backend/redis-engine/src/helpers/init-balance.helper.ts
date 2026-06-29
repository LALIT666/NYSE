// Naye user ka balance 0 se initialize karna

import type { Asset, Balance, UserBalance } from "../types/balance.types";
import { balances } from "../storage/balances.storage";

// initBalance: Naya user aaya toh sab assets ka balance 0 set karo
export const initBalance = (userId: string): UserBalance => {
  // Naya UserBalance object banao
  const ub: UserBalance = {
    userId,
    // Charo assets ka balance 0 available, 0 locked
    assets: new Map<Asset, Balance>([
      ["INR", { available: 0, locked: 0 }],
      ["TATA", { available: 0, locked: 0 }],
      ["PAYTM", { available: 0, locked: 0 }],
      ["ZOMATO", { available: 0, locked: 0 }],
    ]),
  };

  // Global balances Map me save karo
  balances.set(userId, ub);

  return ub;
};
