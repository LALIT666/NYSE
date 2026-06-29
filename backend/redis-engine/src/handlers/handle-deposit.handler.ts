// DEPOSIT: User ke account me paisa/stock daalo

import type { EngineResponse } from "../types/engine-response.types";
import type { Asset } from "../types/balance.types";
import { getBalance } from "../helpers/get-balance.helper";

export const handleDeposit = (data: {
  userId: string;
  asset: Asset;
  amount: number;
}): EngineResponse => {
  // User ka balance laao
  const ub = getBalance(data.userId);

  // Us specific asset ka balance nikalo
  const bal = ub.assets.get(data.asset);

  // Agar asset valid nahi hai toh error
  if (!bal) return { ok: false, message: "Invalid asset" };

  // Available balance me amount jod do
  bal.available += data.amount;

  // Updated balance return karo
  return { ok: true, data: { balance: bal } };
};
