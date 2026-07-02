import { pgPool } from "../postgres/postgres.pool";
import type { Trade } from "../types/trade.types";

// Helper: trade ko DB me save karo
const persistTrade = async (trade: Trade): Promise<void> => {
  try {
    await pgPool.query(
      `INSERT INTO trades 
        (trade_id, market, price, quantity, buyer_id, seller_id, buy_order, sell_order, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        trade.tradeId,
        trade.market,
        trade.price,
        trade.quantity,
        trade.buyerUserId,
        trade.sellerUserId,
        trade.buyOrderId,
        trade.sellOrderId,
        trade.timestamp,
      ],
    );
  } catch (err) {
    console.error("Failed to persist trade:", err);
  }
};
