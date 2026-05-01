import { Router } from "express";
import { createOrder, orders } from "../data/order.data";
import { validateOrders } from "../middlewares/validate-order.middleware";

const ordersRouter = Router();

ordersRouter.get("/", (req, res) => {
  res.json({
    orders,
  });
});

ordersRouter.post("/", validateOrders, (req, res) => {
  const { symbol, type, quantity, price } = req.body;

  const result = createOrder({ symbol, type, quantity, price });

  if (!result) {
    return res
      .status(500)
      .json({ success: false, message: "Error in creating new order" });
  }

  if (result.matched) {
    return res.status(201).json({
      order: result.order,
      matched: true,
      matchedWith: result.matchOrder,
    });
  }

  return res.status(201).json({
    order: result.order,
    matched: false,
  });
});

export default ordersRouter;
