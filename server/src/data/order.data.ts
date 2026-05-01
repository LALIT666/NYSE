import type { Order, SymbolEnum, OrderType } from "../types/order.types";

export const orders: Order[] = [];

export function createOrder({
  symbol,
  type,
  quantity,
  price,
}: {
  symbol: SymbolEnum;
  type: OrderType;
  quantity: number;
  price: number;
}): Order {
  const newOrder: Order = {
    id: Date.now().toString(),
    symbol,
    type,
    quantity,
    price,
    status: "open",
    timestamp: new Date().toISOString(),
  };

  orders.push(newOrder);

  return newOrder;
}
