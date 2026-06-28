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

//Trade -- market
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

export interface Kline {
  open: number; // us time period ki shuruaat ki price
  high: number; // us time period ki sabse mehengi price
  low: number; // us time period ki sabse sasti price
  close: number; // us time period ki akhri price
  volume: number; // us time period me total kitna trade hua
  timestamp: Date;
}

export interface Depth {
  bids: [number, number][]; // kharidne wale - [price, quantity] format me -- ME ISME HAMASHA CONFUSE HOTA HU
  asks: [number, number][]; // bechne wale   - [price, quantity] format me
}

export interface Ticker {
  market: Market;
  lastPrice: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  priceChange24h: number; // up/down in the last 24 hours
}
