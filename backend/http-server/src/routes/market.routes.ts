import { Router, type Request, type Response } from "express";
import { sendAndWait } from "../redis/send-and-wait";

const router = Router();

router.get("/markets", (_req: Request, res: Response): void => {
  res.json({
    markets: ["TATA_INR", "PAYTM_INR", "ZOMATO_INR"],
  });
});

router.get(
  "/depth/:market",
  async (req: Request, res: Response): Promise<void> => {
    const result = await sendAndWait("GET_DEPTH", {
      market: req.params.market,
    });

    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }

    res.json(result.data);
  },
);

router.get(
  "/ticker/:market",
  async (req: Request, res: Response): Promise<void> => {
    const result = await sendAndWait("GET_TICKER", {
      market: req.params.market,
    });

    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }

    res.json(result.data);
  },
);

router.get(
  "/trades/:market",
  async (req: Request, res: Response): Promise<void> => {
    const result = await sendAndWait("GET_TRADES", {
      market: req.params.market,
    });

    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }

    res.json(result.data);
  },
);

export default router;
