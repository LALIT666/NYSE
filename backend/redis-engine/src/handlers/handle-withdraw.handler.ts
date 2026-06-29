// WITHDRAW: User ke account se paisa/stock nikalo

import type { EngineResponse } from "../types/engine-response.types";
import type { Asset } from "../types/balance.types";
import { getBalance } from "../helpers/get-balance.helper";

export const handleWithdraw = (data: {
  userId: string;
  asset: Asset;
  amount: number;
}): EngineResponse => {
  const ub = getBalance(data.userId);
  const bal = ub.assets.get(data.asset);

  if (!bal) return { ok: false, message: "Invalid asset" };

  // Check karo itna balance available hai ya nahi
  // Locked balance se withdraw nahi kar sakte
  if (bal.available < data.amount) {
    return { ok: false, message: "Insufficient balance" };
  }

  // Available se ghata do
  bal.available -= data.amount;

  return { ok: true, data: { balance: bal } };
};
