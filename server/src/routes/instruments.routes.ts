import { Router } from "express";
import { instruments } from "../data/instruments.data";

export const instumentsRouter = Router();

instumentsRouter.get("/", (req, res) => {
  res.json(instruments);
});

export default instumentsRouter;
