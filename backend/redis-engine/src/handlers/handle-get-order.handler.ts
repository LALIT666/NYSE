// GET_ORDER: Ek specific order dekhna

import type { EngineResponse } from "../types/engine-response.types";
import { orders } from "../storage/orders.storage";

export const handleGetOrder = (data: {
  userId: string;
  orderId: string;
}): EngineResponse => {
  // orderId se order dhundo
  const order = orders.get(data.orderId);

  // Order nahi mila
  if (!order) return { ok: false, message: "Order not found" };

  // Doosre user ka order nahi dekh sakte
  if (order.userId !== data.userId) {
    return { ok: false, message: "Forbidden" };
  }

  return { ok: true, data: order };
};
