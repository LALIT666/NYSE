// Trade tab banta hai jab do orders match hote hai

import type { Market } from "./order.types";

export interface Trade {
  tradeId: string;
  market: Market;
  price: number; // Kis price pe sauda hua
  quantity: number; // Kitna quantity trade hua
  buyerUserId: string;
  sellerUserId: string;
  buyOrderId: string;
  sellOrderId: string;
  timestamp: Date;
}
