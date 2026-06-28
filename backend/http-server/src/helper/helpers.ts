import { assert } from "node:console";
import { balances } from "../storage/in-memory-database";
import type { Asset, Balance, UserBalance } from "../types/types";

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

//GET USER BALANCE

export const getUserBalance = (userId: string): UserBalance => {
  return balances.get(userId) || initBalance(userId);
};

//converting userbalance into JSON object

export const serializeBalance = (ub: UserBalance) => {
  const obj: Record<string, Balance> = {};

  ub.assets.forEach((bal, asset) => {
    obj[asset] = bal;
  });

  return obj;
};
