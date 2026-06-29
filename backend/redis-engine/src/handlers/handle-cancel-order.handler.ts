import type { EngineResponse } from "../types/engine-response.types";
import { orders } from "../storage/orders.storage";
import { getBalance } from "../helpers/get-balance.helper";
import { marketAssets } from "../config/market.config";
import { computeDepth } from "../helpers/compute-depth.helper";
import { publishEvent } from "../helpers/publish-event.helper";

export const handleCancelOrder = (data: {
  userId: string;
  orderId: string;
}): EngineResponse => {
  const order = orders.get(data.orderId);
  if (!order) return { ok: false, message: "Order not found" };
  if (order.userId !== data.userId) {
    return { ok: false, message: "Forbidden" };
  }
  if (order.status === "filled" || order.status === "cancelled") {
    return { ok: false, message: `Cannot cancel ${order.status} order` };
  }

  const ub = getBalance(order.userId);
  const { base, quote } = marketAssets[order.market];
  const remaining = order.quantity - order.filledQuantity;

  if (order.kind === "buy") {
    const qb = ub.assets.get(quote)!;
    const unlock = remaining * order.price;
    qb.locked -= unlock;
    qb.available += unlock;
  } else {
    const bb = ub.assets.get(base)!;
    bb.locked -= remaining;
    bb.available += remaining;
  }

  order.status = "cancelled";
  order.updatedAt = new Date();
  orders.set(order.orderId, order);

  // 🔥 Depth update publish karo
  void publishEvent(`depth@${order.market}`, computeDepth(order.market));

  // 🔥 User ko order cancelled event bhejo
  void publishEvent(`orders@${order.userId}`, {
    orderId: order.orderId,
    status: "cancelled",
  });

  return {
    ok: true,
    data: { orderId: order.orderId, status: "cancelled" },
  };
};
