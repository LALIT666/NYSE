import { Router, type Request, type Response } from "express";
import { AVAILABLE_MARKETS, orders } from "../data/in-memory-database";
import type { Depth, Market } from "../types-interfaces/types";
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
