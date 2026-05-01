import { matchOrder } from "../service/matching-engine.service";
import type { Order, OrderType, SymbolEnum } from "../types/order.types";

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
}) {
  const newOrder: Order = {
    id: Date.now().toString(),
    symbol,
    type,
    quantity,
    price,
    status: "open",
    timestamp: new Date().toISOString(),
  };

  // ✅ Try matching BEFORE pushing to array
  const result = matchOrder(newOrder, orders);

  // ✅ Push order after matching attempt
  orders.push(newOrder);

  return {
    order: newOrder,
    ...result,
  };
}
