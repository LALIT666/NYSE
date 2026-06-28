// ==================== HANDLERS ====================
import { v4 as uuidv4 } from "uuid";

import {
  AVAILABLE_MARKETS,
  balances,
  marketAssets,
  marketTrades,
  orders,
  trades,
  userOrders,
} from "../database/engineState";
import { getBalance, initBalance, serializeBalance } from "../helpers/helpers";
import { matchOrder } from "../matchingEngine/matchingEngine";
import type { IncomingMessage, EngineResponse, Order } from "../types/types";

export const handleCreateOrder = (
  data: Extract<IncomingMessage, { type: "CREATE_ORDER" }>["data"],
): EngineResponse => {
  const { userId, kind, orderType, price, quantity, market } = data;

  if (!AVAILABLE_MARKETS.includes(market)) {
    return { ok: false, message: "Invalid market" };
  }

  const ub = getBalance(userId);
  const { base, quote } = marketAssets[market];

  // Balance lock
  if (kind === "buy") {
    const needed = price * quantity;
    const qb = ub.assets.get(quote)!;
    if (qb.available < needed) {
      return { ok: false, message: `Insufficient ${quote} balance` };
    }
    qb.available -= needed;
    qb.locked += needed;
  } else {
    const bb = ub.assets.get(base)!;
    if (bb.available < quantity) {
      return { ok: false, message: `Insufficient ${base} balance` };
    }
    bb.available -= quantity;
    bb.locked += quantity;
  }

  // Order create
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

  // Match karo
  const fills = matchOrder(order);

  // Status update incoming order ka
  if (order.filledQuantity === order.quantity) {
    order.status = "filled";
  } else if (order.filledQuantity > 0) {
    order.status = "partial";
  }
  order.updatedAt = new Date();

  // Save
  orders.set(order.orderId, order);
  if (!userOrders.has(userId)) userOrders.set(userId, new Set());
  userOrders.get(userId)!.add(order.orderId);

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

export const handleCancelOrder = (
  data: Extract<IncomingMessage, { type: "CANCEL_ORDER" }>["data"],
): EngineResponse => {
  const order = orders.get(data.orderId);
  if (!order) return { ok: false, message: "Order not found" };
  if (order.userId !== data.userId) return { ok: false, message: "Forbidden" };
  if (order.status === "filled" || order.status === "cancelled")
    return { ok: false, message: `Cannot cancel ${order.status} order` };

  // Unlock balance
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

  return { ok: true, data: { orderId: order.orderId, status: "cancelled" } };
};

export const handleGetOrder = (
  data: Extract<IncomingMessage, { type: "GET_ORDER" }>["data"],
): EngineResponse => {
  const order = orders.get(data.orderId);
  if (!order) return { ok: false, message: "Order not found" };
  if (order.userId !== data.userId) return { ok: false, message: "Forbidden" };
  return { ok: true, data: order };
};

export const handleGetOpenOrders = (
  data: Extract<IncomingMessage, { type: "GET_OPEN_ORDERS" }>["data"],
): EngineResponse => {
  const ids = userOrders.get(data.userId) ?? new Set<string>();
  const result: Order[] = [];
  ids.forEach((id) => {
    const o = orders.get(id);
    if (o && (o.status === "pending" || o.status === "partial")) {
      result.push(o);
    }
  });
  return { ok: true, data: { orders: result } };
};

export const handleGetOrderHistory = (
  data: Extract<IncomingMessage, { type: "GET_ORDER_HISTORY" }>["data"],
): EngineResponse => {
  const ids = userOrders.get(data.userId) ?? new Set<string>();
  const result: Order[] = [];
  ids.forEach((id) => {
    const o = orders.get(id);
    if (o && (o.status === "filled" || o.status === "cancelled")) {
      result.push(o);
    }
  });
  return { ok: true, data: { orders: result } };
};

export const handleGetDepth = (
  data: Extract<IncomingMessage, { type: "GET_DEPTH" }>["data"],
): EngineResponse => {
  if (!AVAILABLE_MARKETS.includes(data.market)) {
    return { ok: false, message: "Invalid market" };
  }

  const bidsMap = new Map<number, number>();
  const asksMap = new Map<number, number>();

  orders.forEach((o) => {
    if (o.market !== data.market) return;
    if (o.status !== "pending" && o.status !== "partial") return;
    const remaining = o.quantity - o.filledQuantity;
    if (remaining <= 0) return;

    if (o.kind === "buy") {
      bidsMap.set(o.price, (bidsMap.get(o.price) ?? 0) + remaining);
    } else {
      asksMap.set(o.price, (asksMap.get(o.price) ?? 0) + remaining);
    }
  });

  const bids: [number, number][] = Array.from(bidsMap.entries()).sort(
    (a, b) => b[0] - a[0],
  );
  const asks: [number, number][] = Array.from(asksMap.entries()).sort(
    (a, b) => a[0] - b[0],
  );

  return { ok: true, data: { bids, asks } };
};

export const handleGetTicker = (
  data: Extract<IncomingMessage, { type: "GET_TICKER" }>["data"],
): EngineResponse => {
  if (!AVAILABLE_MARKETS.includes(data.market)) {
    return { ok: false, message: "Invalid market" };
  }

  const mTrades = marketTrades.get(data.market) ?? [];
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const last24h = mTrades.filter((t) => t.timestamp.getTime() > cutoff);
  const prices = last24h.map((t) => t.price);
  const volume = last24h.reduce((acc, t) => acc + t.quantity, 0);

  return {
    ok: true,
    data: {
      market: data.market,
      lastPrice: mTrades.length ? mTrades[mTrades.length - 1]!.price : 0,
      high24h: prices.length ? Math.max(...prices) : 0,
      low24h: prices.length ? Math.min(...prices) : 0,
      volume24h: volume,
      priceChange24h:
        prices.length > 1 ? prices[prices.length - 1]! - prices[0]! : 0,
    },
  };
};

export const handleGetTrades = (
  data: Extract<IncomingMessage, { type: "GET_TRADES" }>["data"],
): EngineResponse => {
  if (!AVAILABLE_MARKETS.includes(data.market)) {
    return { ok: false, message: "Invalid market" };
  }
  const mTrades = marketTrades.get(data.market) ?? [];
  return { ok: true, data: { trades: mTrades.slice(-50).reverse() } };
};

export const handleGetUserTrades = (
  data: Extract<IncomingMessage, { type: "GET_USER_TRADES" }>["data"],
): EngineResponse => {
  const myTrades = trades.filter(
    (t) => t.buyerUserId === data.userId || t.sellerUserId === data.userId,
  );
  return { ok: true, data: { trades: myTrades } };
};

export const handleGetBalance = (
  data: Extract<IncomingMessage, { type: "GET_BALANCE" }>["data"],
): EngineResponse => {
  const ub = getBalance(data.userId);
  return { ok: true, data: { balances: serializeBalance(ub) } };
};

export const handleDeposit = (
  data: Extract<IncomingMessage, { type: "DEPOSIT" }>["data"],
): EngineResponse => {
  const ub = getBalance(data.userId);
  const bal = ub.assets.get(data.asset);
  if (!bal) return { ok: false, message: "Invalid asset" };
  bal.available += data.amount;
  return { ok: true, data: { balance: bal } };
};

export const handleWithdraw = (
  data: Extract<IncomingMessage, { type: "WITHDRAW" }>["data"],
): EngineResponse => {
  const ub = getBalance(data.userId);
  const bal = ub.assets.get(data.asset);
  if (!bal) return { ok: false, message: "Invalid asset" };
  if (bal.available < data.amount)
    return { ok: false, message: "Insufficient balance" };
  bal.available -= data.amount;
  return { ok: true, data: { balance: bal } };
};

export const handleInitBalance = (
  data: Extract<IncomingMessage, { type: "INIT_BALANCE" }>["data"],
): EngineResponse => {
  if (!balances.has(data.userId)) initBalance(data.userId);
  return { ok: true, data: { userId: data.userId } };
};
