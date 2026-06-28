// Order lagana, dekhna, cancel karna

import { Router, type Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { OrderSchema } from "../schemas/order.schema";
import { sendAndWait } from "../redis/send-and-wait";
import type { AuthRequest } from "../types/auth.types";

const router = Router();

router.use(authMiddleware);

router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = OrderSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.issues,
    });
    return;
  }

  const result = await sendAndWait("CREATE_ORDER", {
    userId: req.user!.userId,
    kind: parsed.data.kind,
    orderType: parsed.data.type,
    price: parsed.data.price,
    quantity: parsed.data.quantity,
    market: parsed.data.market,
  });

  if (!result.ok) {
    res.status(400).json({ message: result.message });
    return;
  }

  res.status(201).json(result.data);
});

router.get(
  "/:orderId",
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await sendAndWait("GET_ORDER", {
      userId: req.user!.userId,
      orderId: req.params.orderId,
    });

    if (!result.ok) {
      const code = result.message === "Order not found" ? 404 : 403;
      res.status(code).json({ message: result.message });
      return;
    }

    res.json(result.data);
  },
);

router.delete(
  "/:orderId",
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await sendAndWait("CANCEL_ORDER", {
      userId: req.user!.userId,
      orderId: req.params.orderId,
    });

    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }

    res.json({ message: "Order cancelled", ...(result.data as object) });
  },
);

router.get(
  "/open/list",
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await sendAndWait("GET_OPEN_ORDERS", {
      userId: req.user!.userId,
    });

    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }

    res.json(result.data);
  },
);

router.get(
  "/history/list",
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await sendAndWait("GET_ORDER_HISTORY", {
      userId: req.user!.userId,
    });

    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }

    res.json(result.data);
  },
);

export default router;
