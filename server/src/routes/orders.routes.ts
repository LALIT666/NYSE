import { Router } from "express";
import { createOrder, orders } from "../data/order.data";

const ordersRouter = Router();

ordersRouter.get("/", (req, res) => {
  res.json({
    orders,
  });
});

ordersRouter.post("/", (req, res) => {
  const { symbol, type, quantity, price } = req.body;

  const order = createOrder({ symbol, type, quantity, price });

  if (!order) {
    return res.status(500).json({ message: "Error in creating new order" });
  }

  return res.status(201).json({ order });
});

export default ordersRouter;
