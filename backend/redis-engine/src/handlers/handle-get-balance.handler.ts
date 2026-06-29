// GET_BALANCE: User ka current balance dikhao

import type { EngineResponse } from "../types/engine-response.types";
import { getBalance } from "../helpers/get-balance.helper";
import { serializeBalance } from "../helpers/serialize-balance.helper";

export const handleGetBalance = (data: { userId: string }): EngineResponse => {
  // User ka balance laao
  const ub = getBalance(data.userId);

  // Map ko JSON-friendly object me convert karke bhejo
  return { ok: true, data: { balances: serializeBalance(ub) } };
};
