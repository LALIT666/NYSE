import { email } from "zod";
import type { Request } from "express";

export interface User {
  userId: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export type Asset = "INR" | "TATA" | "PAYTM" | "ZOMATO";

export type Market = "TATA_INR" | "PAYTM_INR" | "ZOMATO_INR";

export type OrderKind = "buy" | "sell";

export type OrderType = "limit" | "market";

export interface Balance {
  available: number; // jo paisa/stock abhi use kar sakte ho
  locked: number; // jo paisa/stock kisi order me fas gaya hai, use nahi kar sakte abhi
}

export interface UserBalance {
  userId: string;
  assets: Map<Asset, Balance>;
}

//for middleware

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

//Order

export type OrderStatus = "pending" | "filled" | "partial" | "cancelled";

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
