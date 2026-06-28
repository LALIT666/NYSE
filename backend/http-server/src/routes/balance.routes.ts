// Balance dekhna, deposit karna, withdraw karna

import { Router, type Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { DepositSchema, WithdrawSchema } from "../schemas/balance.schema";
import { sendAndWait } from "../redis/send-and-wait";
import type { AuthRequest } from "../types/auth.types";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await sendAndWait("GET_BALANCE", {
    userId: req.user!.userId,
  });

  if (!result.ok) {
    res.status(400).json({ message: result.message });
    return;
  }

  res.json(result.data);
});

router.post(
  "/deposit",
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = DepositSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.issues,
      });
      return;
    }

    const result = await sendAndWait("DEPOSIT", {
      userId: req.user!.userId,
      asset: parsed.data.asset,
      amount: parsed.data.amount,
    });

    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }

    res.json({ message: "Deposit successful", ...(result.data as object) });
  },
);
router.post(
  "/withdraw",
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = WithdrawSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.issues,
      });
      return;
    }

    const result = await sendAndWait("WITHDRAW", {
      userId: req.user!.userId,
      asset: parsed.data.asset,
      amount: parsed.data.amount,
    });

    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }

    res.json({ message: "Withdraw successful", ...(result.data as object) });
  },
);

export default router;
