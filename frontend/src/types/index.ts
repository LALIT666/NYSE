export type Market = "TATA_INR" | "PAYTM_INR" | "ZOMATO_INR";
export type Asset = "INR" | "TATA" | "PAYTM" | "ZOMATO";
export type OrderKind = "buy" | "sell";
export type OrderType = "limit" | "market";
export type OrderStatus = "pending" | "partial" | "filled" | "cancelled";

export interface Depth {
  bids: [number, number][];
  asks: [number, number][];
}

export interface Trade {
  tradeId: string;
  price: number;
  quantity: number;
  timestamp: string;
}

export interface Order {
  orderId: string;
  kind: OrderKind;
  type: OrderType;
  price: number;
  quantity: number;
  filledQuantity: number;
  market: Market;
  status: OrderStatus;
}

export interface Balance {
  available: number;
  locked: number;
}

export type UserBalances = Record<Asset, Balance>;
