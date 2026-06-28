import {
  marketAssets,
  marketTrades,
  orders,
  trades,
} from "../database/engineState";
import { getBalance } from "../helpers/helpers";
import type { Fill, Market, Order, OrderKind, Trade } from "../types/types";
import { v4 as uuidv4 } from "uuid";

// ==================== MATCHING ENGINE ====================
export const matchOrder = (incoming: Order): Fill[] => {
  const fills: Fill[] = [];

  // Opposite side ke orders nikalo, same market me
  const oppositeKind: OrderKind = incoming.kind === "buy" ? "sell" : "buy";
  const candidates: Order[] = [];

  orders.forEach((o) => {
    if (o.market !== incoming.market) return;
    if (o.kind !== oppositeKind) return;
    if (o.status !== "pending" && o.status !== "partial") return;
    if (o.userId === incoming.userId) return; // self-trade prevent

    // Buy ko sell se match: buy.price >= sell.price
    // Sell ko buy se match: sell.price <= buy.price
    if (incoming.kind === "buy" && incoming.price >= o.price) {
      candidates.push(o);
    } else if (incoming.kind === "sell" && incoming.price <= o.price) {
      candidates.push(o);
    }
  });

  // Best price first sort karo
  // Buy aaya hai → sabse sasta sell pehle (ascending)
  // Sell aaya hai → sabse mehnga buy pehle (descending)
  candidates.sort((a, b) => {
    if (incoming.kind === "buy") return a.price - b.price;
    return b.price - a.price;
  });

  for (const counter of candidates) {
    const incomingRemaining = incoming.quantity - incoming.filledQuantity;
    if (incomingRemaining <= 0) break;

    const counterRemaining = counter.quantity - counter.filledQuantity;
    const fillQty = Math.min(incomingRemaining, counterRemaining);
    const fillPrice = counter.price; // resting order ka price

    // Update quantities
    incoming.filledQuantity += fillQty;
    counter.filledQuantity += fillQty;

    // Status update
    counter.status =
      counter.filledQuantity === counter.quantity ? "filled" : "partial";
    counter.updatedAt = new Date();
    orders.set(counter.orderId, counter);

    // Trade record
    const buyOrder = incoming.kind === "buy" ? incoming : counter;
    const sellOrder = incoming.kind === "sell" ? incoming : counter;

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
    trades.push(trade);
    marketTrades.get(incoming.market)!.push(trade);

    // Balances settle karo
    settleTrade(buyOrder, sellOrder, fillQty, fillPrice, incoming.market);

    fills.push({
      price: fillPrice,
      quantity: fillQty,
      tradeId: trade.tradeId,
      counterOrderId: counter.orderId,
    });
  }

  return fills;
};

export const settleTrade = (
  buyOrder: Order,
  sellOrder: Order,
  qty: number,
  price: number,
  market: Market,
): void => {
  const { base, quote } = marketAssets[market];

  const buyerBal = getBalance(buyOrder.userId);
  const sellerBal = getBalance(sellOrder.userId);

  const buyerQuote = buyerBal.assets.get(quote)!;
  const buyerBase = buyerBal.assets.get(base)!;
  const sellerBase = sellerBal.assets.get(base)!;
  const sellerQuote = sellerBal.assets.get(quote)!;

  const cost = qty * price;
  const lockedAtOrderPrice = qty * buyOrder.price; // jitna lock kiya tha

  // Buyer: locked quote ghatao, base barhao
  buyerQuote.locked -= lockedAtOrderPrice;
  buyerBase.available += qty;

  // Agar buy order price > fill price hua, toh extra refund
  const refund = lockedAtOrderPrice - cost;
  if (refund > 0) {
    buyerQuote.available += refund;
  }

  // Seller: locked base ghatao, quote barhao
  sellerBase.locked -= qty;
  sellerQuote.available += cost;
};
