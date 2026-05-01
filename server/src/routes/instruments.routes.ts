import { Router } from "express";
import { instruments, type InstrumentsType } from "../data/instruments.data";

export const instumentsRouter = Router();

function successResponse(data: any) {
  return {
    success: true,
    data,
  };
}

function faliureResponse(message: string) {
  return {
    success: false,
    message,
  };
}

instumentsRouter.get("/", (req, res) => {
  throw new Error("test error");

  return res.json({ instruments: instruments });
});

instumentsRouter.get("/:symbol", (req, res) => {
  const { symbol } = req.params;
  const cleanSymbol = symbol.trim().toUpperCase();

  const instrument = instruments.find(
    (instrument) => instrument.symbol.toUpperCase() === symbol.toUpperCase(),
  );

  if (!instrument) {
    console.warn(`Instrument not found: ${symbol}`);
    return res.status(404).json(faliureResponse("Instrument not found"));
  }

  return res.status(200).json(successResponse({ instrument }));
});

export default instumentsRouter;
