//I am building redis using only one file beacause my mind get boggles while i use multiple files
import { createClient, type RedisClientType } from "redis";
import { v4 as uuidv4 } from "uuid";

const REDIS_URL = "redis://localhost:6379";
const MESSAGES_QUEUE = "messages";

interface SuccessResponse<T = unknown> {
  ok: true;
  data: T;
}

interface ErrorResponse {
  ok: false;
  message: string;
}

type EngineResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

//Init balance

type Asset = "INR" | "TATA" | "PAYTM" | "ZOMATO";

interface Balance {
  available: number;
  locked: number;
}

interface UserBalance {
  userId: string;
  assets: Map<Asset, Balance>;
}

type InitBalanceMessage = {
  type: "INIT_BALANCE";
  clientId: string;
  data: { userId: string };
};

const balances = new Map<string, UserBalance>();

const initBalance = (userId: string): UserBalance => {
  const ub: UserBalance = {
    userId,
    assets: new Map<Asset, Balance>([
      ["INR", { available: 0, locked: 0 }],
      ["TATA", { available: 0, locked: 0 }],
      ["PAYTM", { available: 0, locked: 0 }],
      ["ZOMATO", { available: 0, locked: 0 }],
    ]),
  };

  balances.set(userId, ub);

  return ub;
};

const handleInitBalance = (data: { userId: string }): EngineResponse => {
  if (!balances.has(data.userId)) {
    initBalance(data.userId);
  }

  return { ok: true, data: { userId: data.userId } };
};

/////////////////////////////////////////////////
//2ND

//Get balance
const getBalance = (userId: string): UserBalance => {
  return balances.get(userId) ?? initBalance(userId);
};

// basically we are changing map to normal JSON object because we can not send Map into JSON
const serializeBalance = (ub: UserBalance): Record<string, Balance> => {
  const obj: Record<string, Balance> = {};

  ub.assets.forEach((bal, asset) => {
    obj[asset] = bal;
  });

  return obj;
};

const handleGetBalance = (data: { userId: string }): EngineResponse => {
  const ub = getBalance(data.userId);
  return { ok: true, data: { balances: serializeBalance(ub) } };
};

const handleDeposit = (data: {
  userId: string;
  asset: Asset;
  amount: number;
}): EngineResponse => {
  const ub = getBalance(data.userId);

  const bal = ub.assets.get(data.asset);

  if (!bal) return { ok: false, message: "Invalid asset" };

  bal.available += data.amount;

  return { ok: true, data: { balance: bal } };
};

const handleWithdraw = (data: {
  userId: string;
  asset: Asset;
  amount: number;
}): EngineResponse => {
  const ub = getBalance(data.userId);
  const bal = ub.assets.get(data.asset);

  if (!bal) return { ok: false, message: "Invalid asset" };

  if (bal.available < data.amount)
    return { ok: false, message: "Insufficient balance" };
  bal.available -= data.amount;
  return { ok: true, data: { balances: bal } };
};

/////////////////////////////////////////////////
//3RD
type OrderKind = "buy" | "sell";
type OrderType = "limit" | "market";
type OrderStatus = "pending" | "filled" | "partial" | "cancelled";
type Market = "TATA_INR" | "PAYTM_INR" | "ZOMATO_INR";

interface Order {
  orderId: string;
  userId: string;
  kind: OrderKind;
  type: OrderType;
  price: number;
  quantity: number;
  filledQuantity: number;
  market: Market;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

//OrderId -> Order ka poora data
const orders = new Map<string, Order>();
// UserId  -> Uske saare orderIds ka Set
const userOrders = new Map<string, Set<string>>();

//get Single Order
const handleGetOrder = (data: {
  userId: string;
  orderId: string;
}): EngineResponse => {
  const order = orders.get(data.orderId);
  if (!order) return { ok: false, message: "Order not found" };

  if (order.userId !== data.userId) return { ok: false, message: "Forbidden" }; //can't check other's order

  return { ok: true, data: order };
};

//geting pending orders
const handleGetOpenOrders = (data: { userId: string }): EngineResponse => {
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

//filled or cancelled orders
const handleGetOrderHistory = (data: { userId: string }): EngineResponse => {
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

// !4th

const handleGetDepth = (data: { market: Market }): EngineResponse => {
  const bidsMap = new Map<number, number>();
  const asksMap = new Map<number, number>();

  orders.forEach((o) => {
    if (
      o.market !== data.market ||
      (o.status !== "pending" && o.status !== "partial")
    )
      return;

    const remaining = o.quantity - o.filledQuantity;

    if (o.kind === "buy") {
      bidsMap.set(o.price, (bidsMap.get(o.price) ?? 0) + remaining);
    } else {
      asksMap.set(o.price, (asksMap.get(o.price) ?? 0) + remaining);
    }
  });

  const bids = Array.from(bidsMap.entries()).sort((a, b) => b[0] - a[0]);

  const asks = Array.from(asksMap.entries()).sort((a, b) => a[0] - b[0]);

  return { ok: true, data: { bids: asks } };
};

//Ticker (summary of the last 24 hours)

interface Trade {
  tradeId: string;
  market: Market;
  price: number;
  quantity: number;
  buyerUserId: string;
  sellerUserId: string;
  buyOrderId: string;
  sellOrderId: string;
  timestamp: Date;
}

const marketTrades = new Map<Market, Trade[]>();

const handleTicker = (data: { market: Market }): EngineResponse => {
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

const handleGetTrades = (data: { market: Market }): EngineResponse => {
  const mTrades = marketTrades.get(data.market) ?? [];

  return { ok: true, data: { trades: mTrades.slice(-50).reverse() } };
};

//! 6th part

const marketAssets: Record<Market, { base: Asset; quote: Asset }> = {
  TATA_INR: { base: "TATA", quote: "INR" },
  PAYTM_INR: { base: "PAYTM", quote: "INR" },
  ZOMATO_INR: { base: "ZOMATO", quote: "INR" },
};

const handleCancelOrder = (data: {
  userId: string;
  orderId: string;
}): EngineResponse => {
  const order = orders.get(data.orderId);
  if (!order) return { ok: false, message: "Order not found" };
  if (order.userId !== data.userId) return { ok: false, message: "forbidden" };

  if (order.status === "filled" || order.status === "cancelled")
    return { ok: false, message: "Order already closed" };

  const ub = getBalance(order.userId);
  const { base, quote } = marketAssets[order.market];
  const remainingQty = order.quantity - order.filledQuantity;

  if (order.kind === "buy") {
    const qb = ub.assets.get(quote)!;
    const unlockAmount = remainingQty * order.price;
    qb.locked -= unlockAmount;
    qb.available += unlockAmount;
  } else {
    const bb = ub.assets.get(base)!;
    bb.locked -= remainingQty;
    bb.available += remainingQty;
  }

  order.status = "cancelled";
  order.updatedAt = new Date();
  return { ok: true, data: { orderid: order.orderId, status: "cancelled" } };
};

// ! part 7th

const settleTrade = (
  buyOrder: Order,
  sellOrder: Order,
  qty: number,
  price: number,
  market: Market,
): void => {
  const { base, quote } = marketAssets[market];
  const buyerBal = getBalance(buyOrder.userId);
  const sellerBal = getBalance(sellOrder.userId);

  const cost = qty * price;
  const lockedINR = qty * buyOrder.price;

  buyerBal.assets.get(quote)!.locked -= lockedINR;
  buyerBal.assets.get(base)!.available += qty;

  if (lockedINR > cost)
    buyerBal.assets.get(quote)!.available += lockedINR - cost;

  sellerBal.assets.get(base)!.locked -= qty;
  sellerBal.assets.get(quote)!.available += cost;
};

interface Fill {
  price: number;
  quantity: number;
  tradeId: string;
}
const trades: Trade[] = [];

const matchOrder = (incoming: Order): Fill[] => {
  const fills: Fill[] = [];
  const oppositeKind = incoming.kind === "buy" ? "sell" : "buy";

  const candidates: Order[] = [];

  orders.forEach((o) => {
    if (
      o.market !== incoming.market ||
      o.kind !== oppositeKind ||
      (o.status !== "pending" && o.status !== "partial") ||
      o.userId === incoming.userId
    )
      return;

    if (incoming.kind === "buy" && incoming.price >= o.price)
      candidates.push(o);
    else if (incoming.kind === "sell" && incoming.price <= o.price)
      candidates.push(o);
  });

  candidates.sort((a, b) =>
    incoming.kind === "buy" ? a.price - b.price : b.price - a.price,
  );

  for (const counter of candidates) {
    const neededQty = incoming.quantity - incoming.filledQuantity;

    if (neededQty <= 0) break;

    const availableCounterQty = counter.quantity - counter.filledQuantity;
    const tradeQty = Math.min(neededQty, availableCounterQty);
    const tradePrice = counter.price;

    incoming.filledQuantity += tradeQty;
    counter.filledQuantity += tradeQty;
    counter.status =
      counter.filledQuantity === counter.quantity ? "filled" : "partial";

    counter.updatedAt = new Date();

    const trade: Trade = {
      tradeId: uuidv4(),
      market: incoming.market,
      price: tradePrice,
      quantity: tradeQty,

      buyerUserId: incoming.kind === "buy" ? incoming.userId : counter.userId,

      sellerUserId: incoming.kind === "sell" ? incoming.userId : counter.userId,

      buyOrderId: incoming.kind === "buy" ? incoming.orderId : counter.orderId,

      sellOrderId:
        incoming.kind === "sell" ? incoming.orderId : counter.orderId,

      timestamp: new Date(),
    };

    trades.push(trade);
    marketTrades.get(incoming.market)!.push(trade);

    settleTrade(
      incoming.kind === "buy" ? incoming : counter,
      incoming.kind === "sell" ? incoming : counter,
      tradeQty,
      tradePrice,
      incoming.market,
    );

    fills.push({
      price: tradePrice,
      quantity: tradeQty,
      tradeId: trade.tradeId,
    });
  }

  return fills;
};

const handleCreateOrder = (data: any): EngineResponse => {
  const ub = getBalance(data.userId);
  const { base, quote } = marketAssets[data.market as Market];
  if (data.kind === "buy") {
    const needed = data.price * data.quantity;

    if (ub.assets.get(quote)!.available < needed)
      return { ok: false, message: "No funds" };

    ub.assets.get(quote)!.available -= needed;
    ub.assets.get(quote)!.locked += needed;
  } else {
    if (ub.assets.get(base)!.available < data.quantity)
      return { ok: false, message: "No shares" };
    ub.assets.get(base)!.available -= data.quantity;
    ub.assets.get(base)!.locked += data.quantity;
  }

  const order: Order = {
    orderId: uuidv4(),
    userId: data.userId,
    kind: data.kind,
    type: data.orderType,
    price: data.price,
    quantity: data.quantity,
    filledQuantity: 0,
    market: data.market,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const fills = matchOrder(order);

  order.status =
    order.filledQuantity === order.quantity
      ? "filled"
      : order.filledQuantity > 0
        ? "partial"
        : "pending";

  orders.set(order.orderId, order);

  if (!userOrders.has(data.userId)) {
    userOrders.set(data.userId, new Set());
  }
  userOrders.get(data.userId)!.add(order.orderId);

  return {
    ok: true,
    data: { orderId: order.orderId, status: order.status, fills },
  };
};
