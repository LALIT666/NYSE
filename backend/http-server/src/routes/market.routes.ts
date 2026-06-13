import { Router, type Request, type Response } from "express";
import {
  AVAILABLE_MARKETS,
  marketTrades,
  orders,
} from "../data/in-memory-database";
import type { Depth, Market, Ticker, Trade } from "../types-interfaces/types";
import { object } from "zod";

const router = Router();

// Route 12: GET /api/v1/markets

router.get("/", (_req: Request, res: Response): void => {
  res.json({ markets: AVAILABLE_MARKETS });
});

// Route 13: GET /api/v1/depth/:market
// Orderbook ki depth - kaun kis price pe kharidna bechna chahta hai

router.get("/depth/:market", (req: Request, res: Response): void => {
  const market = req.params.market as Market;

  if (!AVAILABLE_MARKETS.includes(market)) {
    res.status(404).json({ message: "Market not found" });
    return;
  }

  const bidsMap = new Map<number, number>();
  const asksMap = new Map<number, number>();

  orders.forEach((order) => {
    if (order.market !== market) return;

    if (order.status !== "pending" && order.status !== "partial") return;

    const remainingQuantity = order.quantity - order.filledQuantity;

    if (order.kind === "buy") {
      bidsMap.set(
        order.price,
        (bidsMap.get(order.price) || 0) + remainingQuantity,
      );
    } else {
      asksMap.set(
        order.price,
        (asksMap.get(order.price) || 0) + remainingQuantity,
      );
    }
  });

  const depth: Depth = {
    bids: Array.from(bidsMap.entries()).sort((a, b) => b[0] - a[0]),
    asks: Array.from(asksMap.entries()).sort((a, b) => a[0] - b[0]),
  };

  res.json(depth);
});

// Route 14: GET /api/v1/ticker/:market
// Market ka summary - last price, 24h high/low, volume
router.get("/ticker/:market", (req: Request, res: Response): void => {
  const market = req.params.market as Market;

  if (!AVAILABLE_MARKETS.includes(market)) {
    res.status(404).json({ message: "Market not found" });
    return;
  }

  const mTrades = marketTrades.get(market) || [];

  const last24h = mTrades.filter(
    //agar time grater hai filter if inbetween add in array
    (t) => t.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000,
  );

  // Last 24h ke saare trade prices ki array
  const prices = last24h.map((t) => t.price);

  const volume = last24h.reduce((acc, t) => acc + t.quantity, 0);

  const ticker: Ticker = {
    market,
    lastPrice: mTrades.length ? mTrades[mTrades.length - 1]!.price : 0,
    high24h: prices.length ? Math.max(...prices) : 0,
    low24h: prices.length ? Math.min(...prices) : 0,
    volume24h: volume,
    priceChange24h:
      prices.length > 1 ? prices[prices.length - 1]! - prices[0]! : 0,
  };

  res.json(ticker);
});
