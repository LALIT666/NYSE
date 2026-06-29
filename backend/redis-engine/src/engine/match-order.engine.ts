// MATCHING ENGINE - Exchange ka dimaag
// Naya order aaya toh opposite side ke orders se match karo

import { v4 as uuidv4 } from "uuid";
import type { Order, OrderKind } from "../types/order.types";
import type { Trade } from "../types/trade.types";
import type { Fill } from "../types/fill.types";
import { orders } from "../storage/orders.storage";
import { trades, marketTrades } from "../storage/trades.storage";
import { settleTrade } from "./settle-trade.engine";
import { publishEvent } from "../helpers/publish-event.helper";

export const matchOrder = (incoming: Order): Fill[] => {
  const fills: Fill[] = [];

  // Opposite side dhundo
  // Buy aaya hai toh sell dhundo, sell aaya hai toh buy dhundo
  const oppositeKind: OrderKind = incoming.kind === "buy" ? "sell" : "buy";

  // Matching candidates dhundo
  const candidates: Order[] = [];

  orders.forEach((o) => {
    // Sirf same market ke orders
    if (o.market !== incoming.market) return;

    // Sirf opposite side ke orders
    if (o.kind !== oppositeKind) return;

    // Sirf active orders (pending ya partial)
    if (o.status !== "pending" && o.status !== "partial") return;

    // Self-trade prevent - apne se apna match nahi hoga
    if (o.userId === incoming.userId) return;

    // Price check:
    // Buy ko sell se match: buyer ki price >= seller ki price
    // Sell ko buy se match: seller ki price <= buyer ki price
    if (incoming.kind === "buy" && incoming.price >= o.price) {
      candidates.push(o);
    } else if (incoming.kind === "sell" && incoming.price <= o.price) {
      candidates.push(o);
    }
  });

  // Best price first sort karo
  // Buy aaya hai → sabse sasta sell pehle match hoga (ascending)
  // Sell aaya hai → sabse mehnga buy pehle match hoga (descending)
  candidates.sort((a, b) => {
    if (incoming.kind === "buy") return a.price - b.price;
    return b.price - a.price;
  });

  // Ek ek kar ke match karo
  for (const counter of candidates) {
    // Incoming order me kitna baki hai
    const incomingRemaining = incoming.quantity - incoming.filledQuantity;

    // Agar pura fill ho gaya toh ruko
    if (incomingRemaining <= 0) break;

    // Counter order me kitna baki hai
    const counterRemaining = counter.quantity - counter.filledQuantity;

    // Jo kam hai utna fill hoga
    const fillQty = Math.min(incomingRemaining, counterRemaining);

    // Fill price = resting order (counter) ki price
    // Ye market ka rule hai - jo pehle se order book me tha uski price lagti hai
    const fillPrice = counter.price;

    // Dono orders ki filled quantity update karo
    incoming.filledQuantity += fillQty;
    counter.filledQuantity += fillQty;

    // Counter order ka status update karo
    counter.status =
      counter.filledQuantity === counter.quantity ? "filled" : "partial";
    counter.updatedAt = new Date();

    // Counter order save karo
    orders.set(counter.orderId, counter);

    // Buyer aur seller kaun hai decide karo
    const buyOrder = incoming.kind === "buy" ? incoming : counter;
    const sellOrder = incoming.kind === "sell" ? incoming : counter;

    // Trade record banao
    const trade: Trade = {
      tradeId: uuidv4(),
      market: incoming.market,
      price: fillPrice,
      quantity: fillQty,
      buyerUserId: buyOrder.userId,
      sellerUserId: sellOrder.userId,
      buyOrderId: buyOrder.orderId,
      sellOrderId: sellOrder.orderId,
      timestamp: new Date(),
    };

    // Trade save karo dono storage me
    trades.push(trade);
    marketTrades.get(incoming.market)!.push(trade);

    // Balance settle karo (paisa transfer)
    settleTrade(buyOrder, sellOrder, fillQty, fillPrice, incoming.market);

    // Fill record banao
    fills.push({
      price: fillPrice,
      quantity: fillQty,
      tradeId: trade.tradeId,
      counterOrderId: counter.orderId,
    });

    // 🔥 Trade event publish karo (WebSocket subscribers ko milega)
    void publishEvent(`trades@${incoming.market}`, {
      tradeId: trade.tradeId,
      price: trade.price,
      quantity: trade.quantity,
      timestamp: trade.timestamp,
    });

    // 🔥 Counter order wale user ko order update bhejo
    void publishEvent(`orders@${counter.userId}`, {
      orderId: counter.orderId,
      status: counter.status,
      filledQuantity: counter.filledQuantity,
      executedQty: fillQty,
      executedPrice: fillPrice,
    });
  }

  return fills;
};
