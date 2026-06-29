// User ka balance laao
// Agar pehle se nahi hai toh naya bana ke do

import type { UserBalance } from "../types/balance.types";
import { balances } from "../storage/balances.storage";
import { initBalance } from "./init-balance.helper";

export const getBalance = (userId: string): UserBalance => {
  // balances Map me dhundo
  // ?? matlab: agar undefined mila toh right wala chalao
  return balances.get(userId) ?? initBalance(userId);
};
