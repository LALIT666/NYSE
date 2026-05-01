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

  const order = createOrder({ symbol, type, quantity, price });

  if (!order) {
    return res.status(500).json({ message: "Error in creating new order" });
  }

  return res.status(201).json({ order });
});

export default ordersRouter;
