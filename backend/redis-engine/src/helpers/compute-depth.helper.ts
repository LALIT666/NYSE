// Orderbook ki depth calculate karo
// Kaun kis price pe kitna kharidna/bechna chahta hai

import type { Market } from "../types/order.types";
import { orders } from "../storage/orders.storage";

export const computeDepth = (market: Market) => {
  // Price -> total quantity at that price
  const bidsMap = new Map<number, number>(); // kharidne wale
  const asksMap = new Map<number, number>(); // bechne wale

  // Saare orders me se is market ke active orders dhundo
  orders.forEach((o) => {
    // Sirf is market ke orders chahiye
    if (o.market !== market) return;

    // Sirf active (pending/partial) orders
    if (o.status !== "pending" && o.status !== "partial") return;

    // Kitna quantity abhi baki hai
    const remaining = o.quantity - o.filledQuantity;
    if (remaining <= 0) return;

    if (o.kind === "buy") {
      // Same price ke orders ki quantity jod do
      bidsMap.set(o.price, (bidsMap.get(o.price) ?? 0) + remaining);
    } else {
      asksMap.set(o.price, (asksMap.get(o.price) ?? 0) + remaining);
    }
  });

  return {
    // Bids: Sabse mehengi price pehle (best buyer)
    bids: Array.from(bidsMap.entries()).sort((a, b) => b[0] - a[0]),
    // Asks: Sabse sasti price pehle (best seller)
    asks: Array.from(asksMap.entries()).sort((a, b) => a[0] - b[0]),
  };
};
