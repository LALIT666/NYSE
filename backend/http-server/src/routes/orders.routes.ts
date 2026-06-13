import { Router, type Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { orders, userOrders } from "../data/in-memory-database";
import { authMiddleware } from "../middleware/auth.middleware";
import type { AuthRequest, Order } from "../types-interfaces/types";
import { OrderSchema, type OrderInput } from "../zod-schemas/zod";
import { getUserBalance } from "../helper/helpers";
import { marketAssets } from "../data/in-memory-database";
import { string } from "zod";

const router = Router();

router.use(authMiddleware);

// Route 7: POST /api/v1/order -- talking new order
router.post("/", (req: AuthRequest, res: Response): void => {
  const parsed = OrderSchema.safeParse(req.body);

  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid Input", errors: parsed.error.issues });
    return;
  }

  const input: OrderInput = parsed.data;

  const userId = req.user!.userId;

  const ub = getUserBalance(userId);

  const { base, quote } = marketAssets[input.market];

  if (input.kind === "buy") {
    const needed = input.price * input.quantity;

    const quoteBal = ub.assets.get(quote)!;

    if (quoteBal.available < needed) {
      res.status(400).json({ message: `MC Insufficient ${quote} balance` });
      return;
    }

    quoteBal.available -= needed;
    quoteBal.locked += needed;
  } else {
    const baseBal = ub.assets.get(base)!;

    if (baseBal.available < input.quantity) {
      res.status(400).json({ message: `Insufficient ${base} balance` });
      return;
    }

    baseBal.available -= input.quantity;
    baseBal.locked += input.quantity;
  }

  const newOrder: Order = {
    orderId: uuidv4(),
    userId,
    kind: input.kind,
    type: input.type,
    price: input.price,
    quantity: input.price,
    filledQuantity: 0,
    market: input.market,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  orders.set(newOrder.orderId, newOrder);

  if (!userOrders.has(userId)) {
    userOrders.set(userId, new Set());
  }

  userOrders.get(userId)!.add(newOrder.orderId);

  console.log("Order placed: ", newOrder.orderId);

  res.status(201).json({
    orderId: newOrder.orderId,
    message: "Order placed successfully",
  });
});

// Route 8: GET /api/v1/order/:orderId
// checking specific order

router.get("/:orderId", (req: AuthRequest, res: Response): void => {
  //error -- Argument of type 'string | string[]' is not assignable to parameter of type 'string'.  Type 'string[]' is not assignable to type 'string'.

  const orderId = req.params.orderId!;

  if (typeof orderId !== "string") {
    res.status(401).json({ message: "Invalid orderId" });
    return;
  }
  const order = orders.get(orderId);

  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  if (order.userId !== req.user!.userId) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  res.json(order);
});

// Route 9: DELETE /api/v1/order/:orderId
//to cancel the order
router.delete("/:orderId", (req: AuthRequest, res: Response): void => {
  const orderId = req.params.orderId!;

  if (typeof orderId !== "string") {
    res.status(401).json({ message: "Invalid orderId" });
    return;
  }

  const order = orders.get(orderId);
  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  if (order.userId !== req.user!.userId) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  if (order.status === "filled" || order.status === "cancelled") {
    res.status(400).json({ message: `Cannot cancel ${order.status} order` });
    return;
  }

  const ub = getUserBalance(order.userId);
  const { base, quote } = marketAssets[order.market];

  //kuch kuch order abhi fill ho chuke hai and kuch kuch nahi hue hai toh jo bachae hai kewel wahi unlock hongae right
  const remaining = order.quantity - order.filledQuantity;

  if (order.kind === "buy") {
    const quoteBal = ub.assets.get(quote)!;

    const unlock = remaining * order.price;
    quoteBal.locked -= unlock;
    quoteBal.available += unlock;
  } else {
    const baseBal = ub.assets.get(base)!;
    baseBal.locked -= remaining;
    baseBal.available += remaining;
  }

  order.status = "cancelled";

  order.updatedAt = new Date();

  orders.set(order.orderId, order);

  res.json({ message: "Order cancelled", orderId: order.orderId });
});

// Route 10: GET /api/v1/orders/open/list
// Saare open (pending/partial) orders dekhne ke liye

router.get("/open/list", (req: AuthRequest, res: Response): void => {
  const orderIds = userOrders.get(req.user!.userId) || new Set();

  const openOrders: Order[] = [];

  orderIds.forEach((orderId) => {
    const order = orders.get(orderId);

    if (order && (order.status === "pending" || order.status === "partial")) {
      openOrders.push(order);
    }
  });

  res.json({ orders: openOrders });
});
