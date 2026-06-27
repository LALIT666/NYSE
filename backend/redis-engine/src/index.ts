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
