// User ki personal trade history

import { Router, type Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { sendAndWait } from "../redis/send-and-wait";
import type { AuthRequest } from "../types/auth.types";

const router = Router();

router.use(authMiddleware);

router.get(
  "/trades",
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await sendAndWait("GET_USER_TRADES", {
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
