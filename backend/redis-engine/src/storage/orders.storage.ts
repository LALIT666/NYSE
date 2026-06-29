// Orders ka in-memory storage

import type { Order } from "../types/order.types";

// orderId -> Order object
export const orders = new Map<string, Order>();

// userId -> Set of orderIds
// Ek user ke paas multiple orders ho sakte hai
export const userOrders = new Map<string, Set<string>>();
