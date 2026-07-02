// Saare possible messages jo API server Engine ko bhej sakta hai
// Discriminated Union = TypeScript har case ke liye sahi data type enforce karega

import type { Asset } from "./balance.types";
import type { KlineInterval } from "./kline.types";
import type { OrderKind, OrderType, Market } from "./order.types";

export type IncomingMessage =
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
        startTime?: string; // ISO string
        endTime?: string;
        limit?: number;
      };
    };
