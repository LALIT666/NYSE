import { OrderType, type Order } from "../types/order.types";

export function matchOrder(newOrder: Order, orders: Order[]) {
  const oppositeType =
    newOrder.type === OrderType.BUY ? OrderType.SELL : OrderType.BUY;

  const matchOrder = orders.find((order) => {
    if (
      order.symbol !== newOrder.symbol ||
      order.type !== oppositeType ||
      order.status !== "open"
    ) {
      return false;
    }

    if (newOrder.type === OrderType.BUY) {
      return order.price <= newOrder.price;
    } else {
      return order.price >= newOrder.price;
    }
  });

  if (matchOrder) {
    matchOrder.status = "filled";
    newOrder.status = "filled";

    return {
      matched: true,
      matchOrder,
      newOrder,
    };
  }

  return { matchOrder: false };
}
