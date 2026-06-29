// CREATE_ORDER: Naya order banao, match karo, response do

import { v4 as uuidv4 } from "uuid";
import type { EngineResponse } from "../types/engine-response.types";
import type { Order, OrderKind, OrderType, Market } from "../types/order.types";
import { getBalance } from "../helpers/get-balance.helper";
import { AVAILABLE_MARKETS, marketAssets } from "../config/market.config";
import { orders, userOrders } from "../storage/orders.storage";
import { matchOrder } from "../engine/match-order.engine";
import { computeDepth } from "../helpers/compute-depth.helper";
import { publishEvent } from "../helpers/publish-event.helper";

export const handleCreateOrder = (data: {
  userId: string;
  kind: OrderKind;
  orderType: OrderType;
  price: number;
  quantity: number;
  market: Market;
}): EngineResponse => {
  const { userId, kind, orderType, price, quantity, market } = data;

  // Market valid hai check karo
  if (!AVAILABLE_MARKETS.includes(market)) {
    return { ok: false, message: "Invalid market" };
  }

  // User ka balance laao
  const ub = getBalance(userId);
  const { base, quote } = marketAssets[market];

  // Balance lock karo
  if (kind === "buy") {
    // Kharidne ke liye INR chahiye
    const needed = price * quantity;
    const qb = ub.assets.get(quote)!;

    if (qb.available < needed) {
      return { ok: false, message: `Insufficient ${quote} balance` };
    }

    // Available se ghataao, locked me daalo
    qb.available -= needed;
    qb.locked += needed;
  } else {
    // Bechne ke liye stock chahiye
    const bb = ub.assets.get(base)!;

    if (bb.available < quantity) {
      return { ok: false, message: `Insufficient ${base} balance` };
    }

    bb.available -= quantity;
    bb.locked += quantity;
  }

  // Order object banao
  const order: Order = {
    orderId: uuidv4(),
    userId,
    kind,
    type: orderType,
    price,
    quantity,
    filledQuantity: 0,
    market,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Matching engine se bhidao
  const fills = matchOrder(order);

  // Incoming order ka status update karo
  if (order.filledQuantity === order.quantity) {
    order.status = "filled";
  } else if (order.filledQuantity > 0) {
    order.status = "partial";
  }
  order.updatedAt = new Date();

  // Order save karo
  orders.set(order.orderId, order);

  // User ke orders me add karo
  if (!userOrders.has(userId)) {
    userOrders.set(userId, new Set());
  }
  userOrders.get(userId)!.add(order.orderId);

  // 🔥 Depth update publish karo (orderbook change hua)
  void publishEvent(`depth@${market}`, computeDepth(market));

  // 🔥 User ko order update bhejo
  void publishEvent(`orders@${userId}`, {
    orderId: order.orderId,
    status: order.status,
    filledQuantity: order.filledQuantity,
    quantity: order.quantity,
  });

  return {
    ok: true,
    data: {
      orderId: order.orderId,
      status: order.status,
      filledQuantity: order.filledQuantity,
      fills,
    },
  };
};
