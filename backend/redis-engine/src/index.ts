import { createClient, type RedisClientType } from "redis";
import { v4 as uuidv4 } from "uuid";
import { Pool } from "pg";
import { getPrisma } from "db";

// ==================== CONFIG ====================
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const MESSAGES_QUEUE = "messages";

const DB_CONFIG = {
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "password",
  database: process.env.DB_NAME ?? "exchange",
};

// ==================== TYPES ====================
type OrderKind = "buy" | "sell";
type OrderType = "limit" | "market";
type OrderStatus = "pending" | "filled" | "partial" | "cancelled";
type Market = "TATA_INR" | "PAYTM_INR" | "ZOMATO_INR";
type Asset = "INR" | "TATA" | "PAYTM" | "ZOMATO";
type KlineInterval = "1m" | "5m" | "1h" | "1d";

interface Balance {
  available: number;
  locked: number;
}

interface UserBalance {
  userId: string;
  assets: Map<Asset, Balance>;
}

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

interface Fill {
  price: number;
  quantity: number;
  tradeId: string;
  counterOrderId: string;
}

interface Kline {
  bucket: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trade_count: number;
}

type IncomingMessage =
  | {
      type: "CREATE_ORDER";
      clientId: string;
      data: {
        userId: string;
        kind: OrderKind;
        orderType: OrderType;
        price: number;
        quantity: number;
        market: Market;
      };
    }
  | {
      type: "CANCEL_ORDER";
      clientId: string;
      data: { userId: string; orderId: string };
    }
  | {
      type: "GET_ORDER";
      clientId: string;
      data: { userId: string; orderId: string };
    }
  | { type: "GET_OPEN_ORDERS"; clientId: string; data: { userId: string } }
  | { type: "GET_ORDER_HISTORY"; clientId: string; data: { userId: string } }
  | { type: "GET_DEPTH"; clientId: string; data: { market: Market } }
  | { type: "GET_TICKER"; clientId: string; data: { market: Market } }
  | { type: "GET_TRADES"; clientId: string; data: { market: Market } }
  | { type: "GET_USER_TRADES"; clientId: string; data: { userId: string } }
  | { type: "GET_BALANCE"; clientId: string; data: { userId: string } }
  | {
      type: "DEPOSIT";
      clientId: string;
      data: { userId: string; asset: Asset; amount: number };
    }
  | {
      type: "WITHDRAW";
      clientId: string;
      data: { userId: string; asset: Asset; amount: number };
    }
  | { type: "INIT_BALANCE"; clientId: string; data: { userId: string } }
  | {
      type: "GET_KLINES";
      clientId: string;
      data: {
        market: Market;
        interval: KlineInterval;
        startTime?: string;
        endTime?: string;
        limit?: number;
      };
    };

interface SuccessResponse<T = unknown> {
  ok: true;
  data: T;
}
interface ErrorResponse {
  ok: false;
  message: string;
}
type EngineResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// ==================== STATE (in-memory) ====================
const orders = new Map<string, Order>();
const userOrders = new Map<string, Set<string>>();
const balances = new Map<string, UserBalance>();
const trades: Trade[] = [];
const marketTrades = new Map<Market, Trade[]>();

const AVAILABLE_MARKETS: Market[] = ["TATA_INR", "PAYTM_INR", "ZOMATO_INR"];
const ALL_ASSETS: Asset[] = ["INR", "TATA", "PAYTM", "ZOMATO"];

const marketAssets: Record<Market, { base: Asset; quote: Asset }> = {
  TATA_INR: { base: "TATA", quote: "INR" },
  PAYTM_INR: { base: "PAYTM", quote: "INR" },
  ZOMATO_INR: { base: "ZOMATO", quote: "INR" },
};

AVAILABLE_MARKETS.forEach((m) => marketTrades.set(m, []));

// ==================== CLIENTS ====================
const client: RedisClientType = createClient({ url: REDIS_URL });
const publisher: RedisClientType = createClient({ url: REDIS_URL });
const pgPool = new Pool(DB_CONFIG);
const prisma = getPrisma();

client.on("error", (err) => console.error("Main Redis error:", err));
publisher.on("error", (err) => console.error("Publisher Redis error:", err));
pgPool.on("error", (err) => console.error("Postgres error:", err));

// ==================== EVENT PUBLISHER ====================
const publishEvent = async (channel: string, data: unknown): Promise<void> => {
  try {
    await publisher.publish(channel, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to publish to ${channel}:`, err);
  }
};

// ==================== HELPERS ====================
const initBalanceInMemory = (userId: string): UserBalance => {
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

const getBalance = (userId: string): UserBalance => {
  return balances.get(userId) ?? initBalanceInMemory(userId);
};

const serializeBalance = (ub: UserBalance): Record<string, Balance> => {
  const obj: Record<string, Balance> = {};
  ub.assets.forEach((bal, asset) => {
    obj[asset] = bal;
  });
  return obj;
};

const computeDepth = (market: Market) => {
  const bidsMap = new Map<number, number>();
  const asksMap = new Map<number, number>();

  orders.forEach((o) => {
    if (o.market !== market) return;
    if (o.status !== "pending" && o.status !== "partial") return;
    const remaining = o.quantity - o.filledQuantity;
    if (remaining <= 0) return;

    if (o.kind === "buy") {
      bidsMap.set(o.price, (bidsMap.get(o.price) ?? 0) + remaining);
    } else {
      asksMap.set(o.price, (asksMap.get(o.price) ?? 0) + remaining);
    }
  });

  return {
    bids: Array.from(bidsMap.entries()).sort((a, b) => b[0] - a[0]),
    asks: Array.from(asksMap.entries()).sort((a, b) => a[0] - b[0]),
  };
};

// ==================== DB PERSISTENCE HELPERS ====================
// Trade persist (raw SQL - TimescaleDB hypertable)
const persistTrade = async (trade: Trade): Promise<void> => {
  try {
    await pgPool.query(
      `INSERT INTO trades 
        (trade_id, market, price, quantity, buyer_id, seller_id, buy_order, sell_order, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        trade.tradeId,
        trade.market,
        trade.price,
        trade.quantity,
        trade.buyerUserId,
        trade.sellerUserId,
        trade.buyOrderId,
        trade.sellOrderId,
        trade.timestamp,
      ],
    );
  } catch (err) {
    console.error("Failed to persist trade:", err);
  }
};

// Order persist (Prisma)
const persistOrder = async (order: Order): Promise<void> => {
  try {
    await prisma.order.upsert({
      where: { orderId: order.orderId },
      create: {
        orderId: order.orderId,
        userId: order.userId,
        kind: order.kind,
        type: order.type,
        price: order.price,
        quantity: order.quantity,
        filledQuantity: order.filledQuantity,
        market: order.market,
        status: order.status,
        createdAt: order.createdAt,
      },
      update: {
        filledQuantity: order.filledQuantity,
        status: order.status,
      },
    });
  } catch (err) {
    console.error(`Failed to persist order ${order.orderId}:`, err);
  }
};

// Balance persist (Prisma) - ek user ki ek asset
const persistBalance = async (
  userId: string,
  asset: Asset,
  bal: Balance,
): Promise<void> => {
  try {
    await prisma.balance.upsert({
      where: { userId_asset: { userId, asset } },
      create: {
        userId,
        asset,
        available: bal.available,
        locked: bal.locked,
      },
      update: {
        available: bal.available,
        locked: bal.locked,
      },
    });
  } catch (err) {
    console.error(`Failed to persist balance ${userId}/${asset}:`, err);
  }
};

// User ki saari balances persist
const persistAllBalances = async (userId: string): Promise<void> => {
  const ub = balances.get(userId);
  if (!ub) return;

  const promises: Promise<void>[] = [];
  ub.assets.forEach((bal, asset) => {
    promises.push(persistBalance(userId, asset, bal));
  });
  await Promise.all(promises);
};

// Init balance in DB (4 entries - INR, TATA, PAYTM, ZOMATO)
const initBalanceInDB = async (userId: string): Promise<void> => {
  try {
    for (const asset of ALL_ASSETS) {
      await prisma.balance.upsert({
        where: { userId_asset: { userId, asset } },
        create: { userId, asset, available: 0, locked: 0 },
        update: {},
      });
    }
  } catch (err) {
    console.error(`Failed to init balance for ${userId}:`, err);
  }
};

// ==================== STARTUP LOAD ====================
// Server start hote hi DB se memory me data load
const loadStateFromDB = async (): Promise<void> => {
  console.log("📦 Loading state from DB...");

  // 1. Load saare orders (open + partial)
  const dbOrders = await prisma.order.findMany({
    where: { status: { in: ["pending", "partial"] } },
  });

  // Bhi load karo filled/cancelled (history ke liye)
  const allOrders = await prisma.order.findMany();

  allOrders.forEach((o) => {
    const order: Order = {
      orderId: o.orderId,
      userId: o.userId,
      kind: o.kind as OrderKind,
      type: o.type as OrderType,
      price: o.price,
      quantity: o.quantity,
      filledQuantity: o.filledQuantity,
      market: o.market as Market,
      status: o.status as OrderStatus,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
    orders.set(order.orderId, order);
    if (!userOrders.has(order.userId)) userOrders.set(order.userId, new Set());
    userOrders.get(order.userId)!.add(order.orderId);
  });

  console.log(
    `   ✅ Loaded ${allOrders.length} orders (${dbOrders.length} active)`,
  );

  // 2. Load saare balances
  const dbBalances = await prisma.balance.findMany();

  dbBalances.forEach((b) => {
    if (!balances.has(b.userId)) {
      initBalanceInMemory(b.userId);
    }
    const ub = balances.get(b.userId)!;
    ub.assets.set(b.asset as Asset, {
      available: b.available,
      locked: b.locked,
    });
  });

  console.log(`   ✅ Loaded balances for ${balances.size} users`);

  // 3. Load recent trades (last 1000 per market for ticker/recent feed)
  const recentTradesResult = await pgPool.query<{
    trade_id: string;
    market: string;
    price: number;
    quantity: number;
    buyer_id: string;
    seller_id: string;
    buy_order: string;
    sell_order: string;
    timestamp: Date;
  }>(`SELECT * FROM trades ORDER BY timestamp DESC LIMIT 5000`);

  recentTradesResult.rows.forEach((row) => {
    const trade: Trade = {
      tradeId: row.trade_id,
      market: row.market as Market,
      price: row.price,
      quantity: row.quantity,
      buyerUserId: row.buyer_id,
      sellerUserId: row.seller_id,
      buyOrderId: row.buy_order,
      sellOrderId: row.sell_order,
      timestamp: new Date(row.timestamp),
    };
    trades.push(trade);
    const mt = marketTrades.get(trade.market);
    if (mt) mt.push(trade);
  });

  // Reverse so they're in chronological order
  trades.reverse();
  marketTrades.forEach((arr) => arr.reverse());

  console.log(`   ✅ Loaded ${trades.length} recent trades`);
  console.log("✅ State load complete!");
};

// ==================== MATCHING ENGINE ====================
const matchOrder = (incoming: Order): Fill[] => {
  const fills: Fill[] = [];
  const oppositeKind: OrderKind = incoming.kind === "buy" ? "sell" : "buy";
  const candidates: Order[] = [];

  orders.forEach((o) => {
    if (o.market !== incoming.market) return;
    if (o.kind !== oppositeKind) return;
    if (o.status !== "pending" && o.status !== "partial") return;
    if (o.userId === incoming.userId) return;

    if (incoming.kind === "buy" && incoming.price >= o.price)
      candidates.push(o);
    else if (incoming.kind === "sell" && incoming.price <= o.price)
      candidates.push(o);
  });

  candidates.sort((a, b) => {
    if (incoming.kind === "buy") return a.price - b.price;
    return b.price - a.price;
  });

  for (const counter of candidates) {
    const incomingRemaining = incoming.quantity - incoming.filledQuantity;
    if (incomingRemaining <= 0) break;

    const counterRemaining = counter.quantity - counter.filledQuantity;
    const fillQty = Math.min(incomingRemaining, counterRemaining);
    const fillPrice = counter.price;

    incoming.filledQuantity += fillQty;
    counter.filledQuantity += fillQty;

    counter.status =
      counter.filledQuantity === counter.quantity ? "filled" : "partial";
    counter.updatedAt = new Date();
    orders.set(counter.orderId, counter);

    // 💾 Persist counter order update
    void persistOrder(counter);

    const buyOrder = incoming.kind === "buy" ? incoming : counter;
    const sellOrder = incoming.kind === "sell" ? incoming : counter;

    const trade: Trade = {
      tradeId: uuidv4(),
      market: incoming.market,
      price: fillPrice,
      quantity: fillQty,
      buyerUserId: buyOrder.userId,
      sellerUserId: sellOrder.userId,
      buyOrderId: buyOrder.orderId,
      sellOrderId: sellOrder.orderId,
      timestamp: new Date(),
    };
    trades.push(trade);
    marketTrades.get(incoming.market)!.push(trade);

    // 💾 Persist trade
    void persistTrade(trade);

    settleTrade(buyOrder, sellOrder, fillQty, fillPrice, incoming.market);

    fills.push({
      price: fillPrice,
      quantity: fillQty,
      tradeId: trade.tradeId,
      counterOrderId: counter.orderId,
    });

    // Publish events
    void publishEvent(`trades@${incoming.market}`, {
      tradeId: trade.tradeId,
      price: trade.price,
      quantity: trade.quantity,
      timestamp: trade.timestamp,
    });

    void publishEvent(`orders@${counter.userId}`, {
      orderId: counter.orderId,
      status: counter.status,
      filledQuantity: counter.filledQuantity,
      executedQty: fillQty,
      executedPrice: fillPrice,
    });
  }

  return fills;
};

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
  const buyerQuote = buyerBal.assets.get(quote)!;
  const buyerBase = buyerBal.assets.get(base)!;
  const sellerBase = sellerBal.assets.get(base)!;
  const sellerQuote = sellerBal.assets.get(quote)!;

  const cost = qty * price;
  const lockedAtOrderPrice = qty * buyOrder.price;

  buyerQuote.locked -= lockedAtOrderPrice;
  buyerBase.available += qty;
  const refund = lockedAtOrderPrice - cost;
  if (refund > 0) buyerQuote.available += refund;

  sellerBase.locked -= qty;
  sellerQuote.available += cost;

  // 💾 Persist both users' balances (async)
  void persistAllBalances(buyOrder.userId);
  void persistAllBalances(sellOrder.userId);
};

// ==================== HANDLERS ====================
const handleCreateOrder = async (
  data: Extract<IncomingMessage, { type: "CREATE_ORDER" }>["data"],
): Promise<EngineResponse> => {
  const { userId, kind, orderType, price, quantity, market } = data;

  if (!AVAILABLE_MARKETS.includes(market))
    return { ok: false, message: "Invalid market" };

  const ub = getBalance(userId);
  const { base, quote } = marketAssets[market];

  if (kind === "buy") {
    const needed = price * quantity;
    const qb = ub.assets.get(quote)!;
    if (qb.available < needed)
      return { ok: false, message: `Insufficient ${quote} balance` };
    qb.available -= needed;
    qb.locked += needed;
  } else {
    const bb = ub.assets.get(base)!;
    if (bb.available < quantity)
      return { ok: false, message: `Insufficient ${base} balance` };
    bb.available -= quantity;
    bb.locked += quantity;
  }

  // 💾 Persist balance change (lock)
  void persistAllBalances(userId);

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

  // 💾 Persist new order (before matching)
  await persistOrder(order);

  // Match
  const fills = matchOrder(order);

  if (order.filledQuantity === order.quantity) order.status = "filled";
  else if (order.filledQuantity > 0) order.status = "partial";
  order.updatedAt = new Date();

  orders.set(order.orderId, order);
  if (!userOrders.has(userId)) userOrders.set(userId, new Set());
  userOrders.get(userId)!.add(order.orderId);

  // 💾 Update order status after matching
  void persistOrder(order);

  // Publish events
  void publishEvent(`depth@${market}`, computeDepth(market));
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

const handleCancelOrder = async (
  data: Extract<IncomingMessage, { type: "CANCEL_ORDER" }>["data"],
): Promise<EngineResponse> => {
  const order = orders.get(data.orderId);
  if (!order) return { ok: false, message: "Order not found" };
  if (order.userId !== data.userId) return { ok: false, message: "Forbidden" };
  if (order.status === "filled" || order.status === "cancelled")
    return { ok: false, message: `Cannot cancel ${order.status} order` };

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

  // 💾 Persist
  void persistOrder(order);
  void persistAllBalances(order.userId);

  // Publish
  void publishEvent(`depth@${order.market}`, computeDepth(order.market));
  void publishEvent(`orders@${order.userId}`, {
    orderId: order.orderId,
    status: "cancelled",
  });

  return { ok: true, data: { orderId: order.orderId, status: "cancelled" } };
};

const handleGetOrder = (
  data: Extract<IncomingMessage, { type: "GET_ORDER" }>["data"],
): EngineResponse => {
  const order = orders.get(data.orderId);
  if (!order) return { ok: false, message: "Order not found" };
  if (order.userId !== data.userId) return { ok: false, message: "Forbidden" };
  return { ok: true, data: order };
};

const handleGetOpenOrders = (
  data: Extract<IncomingMessage, { type: "GET_OPEN_ORDERS" }>["data"],
): EngineResponse => {
  const ids = userOrders.get(data.userId) ?? new Set<string>();
  const result: Order[] = [];
  ids.forEach((id) => {
    const o = orders.get(id);
    if (o && (o.status === "pending" || o.status === "partial")) result.push(o);
  });
  return { ok: true, data: { orders: result } };
};

const handleGetOrderHistory = (
  data: Extract<IncomingMessage, { type: "GET_ORDER_HISTORY" }>["data"],
): EngineResponse => {
  const ids = userOrders.get(data.userId) ?? new Set<string>();
  const result: Order[] = [];
  ids.forEach((id) => {
    const o = orders.get(id);
    if (o && (o.status === "filled" || o.status === "cancelled"))
      result.push(o);
  });
  return { ok: true, data: { orders: result } };
};

const handleGetDepth = (
  data: Extract<IncomingMessage, { type: "GET_DEPTH" }>["data"],
): EngineResponse => {
  if (!AVAILABLE_MARKETS.includes(data.market))
    return { ok: false, message: "Invalid market" };
  return { ok: true, data: computeDepth(data.market) };
};

const handleGetTicker = (
  data: Extract<IncomingMessage, { type: "GET_TICKER" }>["data"],
): EngineResponse => {
  if (!AVAILABLE_MARKETS.includes(data.market))
    return { ok: false, message: "Invalid market" };
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

const handleGetTrades = (
  data: Extract<IncomingMessage, { type: "GET_TRADES" }>["data"],
): EngineResponse => {
  if (!AVAILABLE_MARKETS.includes(data.market))
    return { ok: false, message: "Invalid market" };
  const mTrades = marketTrades.get(data.market) ?? [];
  return { ok: true, data: { trades: mTrades.slice(-50).reverse() } };
};

const handleGetUserTrades = (
  data: Extract<IncomingMessage, { type: "GET_USER_TRADES" }>["data"],
): EngineResponse => {
  const myTrades = trades.filter(
    (t) => t.buyerUserId === data.userId || t.sellerUserId === data.userId,
  );
  return { ok: true, data: { trades: myTrades } };
};

const handleGetBalance = (
  data: Extract<IncomingMessage, { type: "GET_BALANCE" }>["data"],
): EngineResponse => {
  const ub = getBalance(data.userId);
  return { ok: true, data: { balances: serializeBalance(ub) } };
};

const handleDeposit = async (
  data: Extract<IncomingMessage, { type: "DEPOSIT" }>["data"],
): Promise<EngineResponse> => {
  const ub = getBalance(data.userId);
  const bal = ub.assets.get(data.asset);
  if (!bal) return { ok: false, message: "Invalid asset" };
  bal.available += data.amount;

  // 💾 Persist
  await persistBalance(data.userId, data.asset, bal);

  return { ok: true, data: { balance: bal } };
};

const handleWithdraw = async (
  data: Extract<IncomingMessage, { type: "WITHDRAW" }>["data"],
): Promise<EngineResponse> => {
  const ub = getBalance(data.userId);
  const bal = ub.assets.get(data.asset);
  if (!bal) return { ok: false, message: "Invalid asset" };
  if (bal.available < data.amount)
    return { ok: false, message: "Insufficient balance" };
  bal.available -= data.amount;

  // 💾 Persist
  await persistBalance(data.userId, data.asset, bal);

  return { ok: true, data: { balance: bal } };
};

const handleInitBalance = async (
  data: Extract<IncomingMessage, { type: "INIT_BALANCE" }>["data"],
): Promise<EngineResponse> => {
  if (!balances.has(data.userId)) initBalanceInMemory(data.userId);
  await initBalanceInDB(data.userId);
  return { ok: true, data: { userId: data.userId } };
};

const handleGetKlines = async (
  data: Extract<IncomingMessage, { type: "GET_KLINES" }>["data"],
): Promise<EngineResponse> => {
  const { market, interval, startTime, endTime, limit = 100 } = data;

  if (!AVAILABLE_MARKETS.includes(market)) {
    return { ok: false, message: "Invalid market" };
  }

  const tableMap: Record<KlineInterval, string> = {
    "1m": "klines_1m",
    "5m": "klines_5m",
    "1h": "klines_1h",
    "1d": "klines_1d",
  };

  const table = tableMap[interval];
  if (!table) return { ok: false, message: "Invalid interval" };

  const conditions: string[] = ["market = $1"];
  const params: (string | number)[] = [market];
  let idx = 2;

  if (startTime) {
    conditions.push(`bucket >= $${idx++}`);
    params.push(startTime);
  }
  if (endTime) {
    conditions.push(`bucket <= $${idx++}`);
    params.push(endTime);
  }

  const query = `
    SELECT bucket, open, high, low, close, volume, trade_count
    FROM ${table}
    WHERE ${conditions.join(" AND ")}
    ORDER BY bucket DESC
    LIMIT $${idx}
  `;
  params.push(limit);

  try {
    const result = await pgPool.query<Kline>(query, params);
    return {
      ok: true,
      data: {
        market,
        interval,
        klines: result.rows.reverse(),
      },
    };
  } catch (err) {
    console.error("Klines query error:", err);
    return { ok: false, message: "Database query failed" };
  }
};

// ==================== ROUTER ====================
const processMessage = async (
  msg: IncomingMessage,
): Promise<EngineResponse> => {
  switch (msg.type) {
    case "CREATE_ORDER":
      return await handleCreateOrder(msg.data);
    case "CANCEL_ORDER":
      return await handleCancelOrder(msg.data);
    case "GET_ORDER":
      return handleGetOrder(msg.data);
    case "GET_OPEN_ORDERS":
      return handleGetOpenOrders(msg.data);
    case "GET_ORDER_HISTORY":
      return handleGetOrderHistory(msg.data);
    case "GET_DEPTH":
      return handleGetDepth(msg.data);
    case "GET_TICKER":
      return handleGetTicker(msg.data);
    case "GET_TRADES":
      return handleGetTrades(msg.data);
    case "GET_USER_TRADES":
      return handleGetUserTrades(msg.data);
    case "GET_BALANCE":
      return handleGetBalance(msg.data);
    case "DEPOSIT":
      return await handleDeposit(msg.data);
    case "WITHDRAW":
      return await handleWithdraw(msg.data);
    case "INIT_BALANCE":
      return await handleInitBalance(msg.data);
    case "GET_KLINES":
      return await handleGetKlines(msg.data);
    default: {
      const _exhaustive: never = msg;
      return { ok: false, message: "Unknown message type" };
    }
  }
};

// ==================== MAIN ====================
const main = async (): Promise<void> => {
  // DB connect
  try {
    await pgPool.query("SELECT 1");
    console.log("✅ TimescaleDB connected");
  } catch (err) {
    console.error("❌ TimescaleDB connection failed:", err);
    process.exit(1);
  }

  await prisma.$connect();
  console.log("✅ Prisma connected");

  // Redis connect
  await client.connect();
  await publisher.connect();
  console.log("✅ Redis connected");

  // 🆕 Load state from DB
  await loadStateFromDB();

  console.log("🚀 Engine started, waiting for messages...");

  // Main loop
  while (true) {
    try {
      const result = await client.brPop(MESSAGES_QUEUE, 0);
      if (!result) continue;

      let msg: IncomingMessage;
      try {
        msg = JSON.parse(result.element) as IncomingMessage;
      } catch {
        console.error("Invalid JSON:", result.element);
        continue;
      }

      console.log(`📨 Received: ${msg.type} (clientId: ${msg.clientId})`);

      const response = await processMessage(msg);

      const responseQueue = `response-${msg.clientId}`;
      await client.lPush(responseQueue, JSON.stringify(response));
      await client.expire(responseQueue, 30);

      console.log(`✅ Responded to ${msg.clientId}`);
    } catch (err) {
      console.error("Engine loop error:", err);
    }
  }
};

main().catch((err) => {
  console.error("Fatal engine error:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down engine...");
  await prisma.$disconnect();
  await pgPool.end();
  await client.quit();
  await publisher.quit();
  process.exit(0);
});
