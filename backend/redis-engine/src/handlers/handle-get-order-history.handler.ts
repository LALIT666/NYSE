// GET_ORDER_HISTORY: User ke purane (filled/cancelled) orders

import type { EngineResponse } from "../types/engine-response.types";
import type { Order } from "../types/order.types";
import { orders, userOrders } from "../storage/orders.storage";

export const handleGetOrderHistory = (data: {
  userId: string;
}): EngineResponse => {
  const ids = userOrders.get(data.userId) ?? new Set<string>();

  const result: Order[] = [];

  ids.forEach((id) => {
    const o = orders.get(id);

    // Sirf filled ya cancelled orders history me aate hai
    if (o && (o.status === "filled" || o.status === "cancelled")) {
      result.push(o);
    }
  });

  return { ok: true, data: { orders: result } };
};
