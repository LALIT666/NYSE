//I am building redis using only one file beacause my mind get boggles while i use multiple files
import { createClient, type RedisClientType } from "redis";

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
