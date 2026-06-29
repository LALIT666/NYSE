// GET_OPEN_ORDERS: User ke saare pending/partial orders

import type { EngineResponse } from "../types/engine-response.types";
import type { Order } from "../types/order.types";
import { orders, userOrders } from "../storage/orders.storage";

export const handleGetOpenOrders = (data: {
  userId: string;
}): EngineResponse => {
  // User ke saare order ids nikalo
  // Agar koi order nahi hai toh empty Set
  const ids = userOrders.get(data.userId) ?? new Set<string>();

  const result: Order[] = [];

  // Har order id ke liye order nikalo aur check karo
  ids.forEach((id) => {
    const o = orders.get(id);

    // Sirf pending ya partial orders open orders hai
    if (o && (o.status === "pending" || o.status === "partial")) {
      result.push(o);
    }
  });

  return { ok: true, data: { orders: result } };
};
