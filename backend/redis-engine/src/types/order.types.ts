// Order se related saare types

// Order kharidna hai ya bechna hai
export type OrderKind = "buy" | "sell";

// Limit order = apni price set karo
// Market order = jo bhi price chal rahi hai uspe le lo
export type OrderType = "limit" | "market";

// Order abhi kis halat me hai
export type OrderStatus = "pending" | "filled" | "partial" | "cancelled";

// Kaunse markets available hai
export type Market = "TATA_INR" | "PAYTM_INR" | "ZOMATO_INR";

// Ek order ka poora data
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
