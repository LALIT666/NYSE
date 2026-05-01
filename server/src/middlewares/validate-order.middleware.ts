import type { Request, Response, NextFunction } from "express";
import { OrderType, SymbolEnum } from "../types/order.types";
import { faliureResponse } from "../utils/helper-function.utils";

export function validateOrders(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { symbol, type, quantity, price } = req.body;

  if (!Object.values(SymbolEnum).includes(symbol)) {
    return res
      .status(400)
      .json(
        faliureResponse(
          "Invalid symbol. Must be one of: AAPL, MSFT, TSLA, NVDA",
        ),
      );
  }

  if (!Object.values(OrderType).includes(type)) {
    return res
      .status(400)
      .json(faliureResponse("Invalid type. Must be buy or sell"));
  }

  if (typeof quantity !== "number" || quantity <= 0) {
    return res
      .status(400)
      .json(faliureResponse("Quantity must be a number greater than 0"));
  }

  if (typeof price !== "number" || price <= 0) {
    return res
      .status(400)
      .json(faliureResponse("Price must be a number greater than 0"));
  }

  next();
}
