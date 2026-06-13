import { Router, type Response } from "express";
import type { AuthRequest } from "../types-interfaces/types";
import { getUserBalance, serializeBalance } from "../helper/helpers";
import { balances } from "../data/in-memory-database";
import { authMiddleware } from "../middleware/auth.middleware";
import { DepositSchema, type DepositInput } from "../zod-schemas/zod";

const router = Router();

router.use(authMiddleware);

//router 4: GET /api/v1/balance

router.get("/", (req: AuthRequest, res: Response): void => {
  const ub = getUserBalance(req.user!.userId);

  res.json({ balances: serializeBalance(ub) });
});

//router 5: POST /api/v1/balance/deposit

router.post("/deposit", (req: AuthRequest, res: Response): void => {
  const parsed = DepositSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.issues,
    });

    return;
  }

  const { asset, amount }: DepositInput = parsed.data;

  const ub = getUserBalance(req.user!.userId);

  const current = ub.assets.get(asset)!;

  current.available += amount;

  ub.assets.set(asset, current);

  res.json({ message: "Deposit successful", balance: current });
});

export default router;
