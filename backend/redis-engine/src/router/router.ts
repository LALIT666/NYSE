import {
  handleCreateOrder,
  handleCancelOrder,
  handleGetOrder,
  handleGetOpenOrders,
  handleGetOrderHistory,
  handleGetDepth,
  handleGetTicker,
  handleGetTrades,
  handleGetUserTrades,
  handleGetBalance,
  handleDeposit,
  handleWithdraw,
  handleInitBalance,
} from "../handlers/handlers";
import type { EngineResponse, IncomingMessage } from "../types/types";

// ==================== ROUTER ====================
export const processMessage = (msg: IncomingMessage): EngineResponse => {
  switch (msg.type) {
    case "CREATE_ORDER":
      return handleCreateOrder(msg.data);
    case "CANCEL_ORDER":
      return handleCancelOrder(msg.data);
    case "GET_ORDER":
      return handleGetOrder(msg.data);
    case "GET_OPEN_ORDERS":
      return handleGetOpenOrders(msg.data);
    case "GET_ORDER_HISTORY":
      return handleGetOrderHistory(msg.data);
    case "GET_DEPTH":
      return handleGetDepth(msg.data);
    case "GET_TICKER":
      return handleGetTicker(msg.data);
    case "GET_TRADES":
      return handleGetTrades(msg.data);
    case "GET_USER_TRADES":
      return handleGetUserTrades(msg.data);
    case "GET_BALANCE":
      return handleGetBalance(msg.data);
    case "DEPOSIT":
      return handleDeposit(msg.data);
    case "WITHDRAW":
      return handleWithdraw(msg.data);
    case "INIT_BALANCE":
      return handleInitBalance(msg.data);
    default: {
      const _exhaustive: never = msg;
      return { ok: false, message: "Unknown message type" };
    }
  }
};
