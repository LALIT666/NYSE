// INIT_BALANCE message ka handler
// Jab naya user signup kare toh API server ye message bhejta hai

import type { EngineResponse } from "../types/engine-response.types";
import { balances } from "../storage/balances.storage";
import { initBalance } from "../helpers/init-balance.helper";

export const handleInitBalance = (data: { userId: string }): EngineResponse => {
  // Check karo pehle se balance hai ya nahi
  // Agar nahi hai tabhi naya banao (duplicate se bachne ke liye)
  if (!balances.has(data.userId)) {
    initBalance(data.userId);
  }

  // Success response bhejo
  return { ok: true, data: { userId: data.userId } };
};
