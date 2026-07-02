import { Router, type Request, type Response } from "express";
import { KlineQuerySchema } from "../schemas/kline.schema";
import { sendAndWait } from "../redis/send-and-wait";

const router = Router();

router.get(
  "/api/v1/klines/:market",
  async (req: Request, res: Response): Promise<void> => {
    const parsed = KlineQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res
        .status(400)
        .json({ message: "Invalid query", errors: parsed.error.issues });
      return;
    }

    const result = await sendAndWait("GET_KLINES", {
      market: req.params.market,
      interval: parsed.data.interval,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      limit: parsed.data.limit,
    });

    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }
    res.json(result.data);
  },
);

export default router;
