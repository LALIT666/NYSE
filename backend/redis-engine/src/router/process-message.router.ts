import type { EngineResponse } from "../types/engine-response.types";
import type { IncomingMessage } from "../types/incoming-message.types";
import { handleInitBalance } from "../handlers/handle-init-balance.handler";
import { handleGetBalance } from "../handlers/handle-get-balance.handler";
import { handleDeposit } from "../handlers/handle-deposit.handler";
import { handleWithdraw } from "../handlers/handle-withdraw.handler";
import { handleGetOrder } from "../handlers/handle-get-order.handler";
import { handleGetOpenOrders } from "../handlers/handle-get-open-orders.handler";
import { handleGetOrderHistory } from "../handlers/handle-get-order-history.handler";
import { handleGetDepth } from "../handlers/handle-get-depth.handler";
import { handleGetTicker } from "../handlers/handle-get-ticker.handler";
import { handleGetTrades } from "../handlers/handle-get-trades.handler";
import { handleGetUserTrades } from "../handlers/handle-get-user-trades.handler";
import { handleCancelOrder } from "../handlers/handle-cancel-order.handler";
import { handleCreateOrder } from "../handlers/handle-create-order.handler";

// Ab msg properly typed hai - TypeScript har case me sahi data type enforce karega
export const processMessage = (msg: IncomingMessage): EngineResponse => {
  switch (msg.type) {
    case "INIT_BALANCE":
      return handleInitBalance(msg.data);
    case "GET_BALANCE":
      return handleGetBalance(msg.data);
    case "DEPOSIT":
      return handleDeposit(msg.data);
    case "WITHDRAW":
      return handleWithdraw(msg.data);
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
    case "CANCEL_ORDER":
      return handleCancelOrder(msg.data);
    case "CREATE_ORDER":
      return handleCreateOrder(msg.data);
    default: {
      // Exhaustive check:
      // Agar koi naya type IncomingMessage me add kiya
      // aur yahan case nahi likha toh TypeScript error dega
      const _exhaustive: never = msg;
      return { ok: false, message: "Unknown message type" };
    }
  }
};
