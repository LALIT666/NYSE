// ==================== TYPES ====================
export type OrderKind = "buy" | "sell";
export type OrderType = "limit" | "market";
export type OrderStatus = "pending" | "filled" | "partial" | "cancelled";
export type Market = "TATA_INR" | "PAYTM_INR" | "ZOMATO_INR";
export type Asset = "INR" | "TATA" | "PAYTM" | "ZOMATO";

export interface Balance {
  available: number;
  locked: number;
}

export interface UserBalance {
  userId: string;
  assets: Map<Asset, Balance>;
}

export interface Order {
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

export interface Trade {
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

export interface Fill {
  price: number;
  quantity: number;
  tradeId: string;
  counterOrderId: string;
}

// ===== Message types (API → Engine) =====
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
  | {
      type: "GET_OPEN_ORDERS";
      clientId: string;
      data: { userId: string };
    }
  | {
      type: "GET_ORDER_HISTORY";
      clientId: string;
      data: { userId: string };
    }
  | {
      type: "GET_DEPTH";
      clientId: string;
      data: { market: Market };
    }
  | {
      type: "GET_TICKER";
      clientId: string;
      data: { market: Market };
    }
  | {
      type: "GET_TRADES";
      clientId: string;
      data: { market: Market };
    }
  | {
      type: "GET_USER_TRADES";
      clientId: string;
      data: { userId: string };
    }
  | {
      type: "GET_BALANCE";
      clientId: string;
      data: { userId: string };
    }
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
  | {
      type: "INIT_BALANCE";
      clientId: string;
      data: { userId: string };
    };

// ===== Response types (Engine → API) =====
export interface SuccessResponse<T = unknown> {
  ok: true;
  data: T;
}

export interface ErrorResponse {
  ok: false;
  message: string;
}

export type EngineResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
