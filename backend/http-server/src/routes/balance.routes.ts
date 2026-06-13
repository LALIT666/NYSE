import { Router, type Response } from "express";
import type { AuthRequest } from "../types-interfaces/types";
import { getUserBalance, serializeBalance } from "../helper/helpers";
import { balances } from "../data/in-memory-database";

const router = Router();

//router 4: GET /api/v1/balance

router.get("/", (req: AuthRequest, res: Response): void => {
  const ub = getUserBalance(req.user!.userId);

  res.json({ balances: serializeBalance(ub) });
});

export default router;
