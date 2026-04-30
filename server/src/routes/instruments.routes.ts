import { Router } from "express";
import { instruments } from "../data/instruments.data";

export const instumentsRouter = Router();

instumentsRouter.get("/", (req, res) => {
  res.json(instruments);
});

instumentsRouter.get("/:symbol", (req, res) => {
  const { symbol } = req.params;

  let instrument = instruments.find(
    (instrument) => instrument.symbol === symbol,
  );

  if (!instrument) {
    res.status(404).json({ message: "Instrument not found" });
  }

  res.status(200).json({
    instrument,
  });
});

export default instumentsRouter;
