import { Router, type Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import type { AuthRequest } from "../types-interfaces/types";
import { trades } from "../data/in-memory-database";

const router = Router();

router.use(authMiddleware);

// Route 17: GET /api/v1/user/trades
router.get("/trades", (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;

  const myTrades = trades.filter((trade) => {
    trade.buyerUserId === userId || trade.sellerUserId === userId;
  });

  res.json({ trades: myTrades });
});

export default router;
