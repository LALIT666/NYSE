// GET_USER_TRADES: User ki personal trade history

import type { EngineResponse } from "../types/engine-response.types";
import { trades } from "../storage/trades.storage";

export const handleGetUserTrades = (data: {
  userId: string;
}): EngineResponse => {
  // Saare trades me se sirf is user ke trades filter karo
  // User buyer bhi ho sakta hai aur seller bhi
  const myTrades = trades.filter(
    (t) => t.buyerUserId === data.userId || t.sellerUserId === data.userId,
  );

  return { ok: true, data: { trades: myTrades } };
};
