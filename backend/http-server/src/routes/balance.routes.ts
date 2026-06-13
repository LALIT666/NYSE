import { assert } from "node:console";
import { Router, type Response } from "express";
import type { AuthRequest } from "../types-interfaces/types";
import { getUserBalance, serializeBalance } from "../helper/helpers";
import { balances } from "../data/in-memory-database";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  DepositSchema,
  WithdrawSchema,
  type DepositInput,
  type WithdrawInput,
} from "../zod-schemas/zod";

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

//Route 6: POST /api/v1/balance/withdraw
router.post("/withdraw", (req: AuthRequest, res: Response): void => {
  const parsed = WithdrawSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.issues,
    });

    return;
  }

  const { asset, amount }: WithdrawInput = parsed.data;

  const ub = getUserBalance(req.user!.userId);
  const current = ub.assets.get(asset)!; //! --> this because current may be possible undefine

  if (current.available < amount) {
    res.status(400).json({ message: "Insufficient balance" });
    return;
  }

  current.available -= amount;

  ub.assets.set(asset, current);

  res.json({ message: "Withdraw successfull", balance: current });
});

export default router;
