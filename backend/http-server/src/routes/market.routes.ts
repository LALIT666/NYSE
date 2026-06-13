import { Router, type Request, type Response } from "express";
import { AVALIABLE_MARKETS } from "../data/in-memory-database";

const router = Router();

// Route 12: GET /api/v1/markets
// Saare available markets ki list dekhne ke liye

router.get("/", (_req: Request, res: Response): void => {
  res.json({ markets: AVALIABLE_MARKETS });
});
