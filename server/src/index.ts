import express from "express";
import dotenv from "dotenv";
dotenv.config();

import instumentsRouter from "./routes/instruments.routes";
import { changePriceInEveryThreeSecond } from "./service/price-poller.service";

const app = express();
const PORT = process.env.PORT;
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/instruments", instumentsRouter);

changePriceInEveryThreeSecond();

app.listen(PORT, () => {
  console.log(`server is running on port: http://localhost:${PORT}`);
});
