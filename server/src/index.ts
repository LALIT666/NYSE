import express from "express";
import dotenv from "dotenv";
dotenv.config();

import instumentsRouter from "./routes/instruments.routes";
import { changePriceInEveryThreeSecond } from "./service/price-poller.service";
import ordersRouter from "./routes/orders.routes";
import { errorHandler } from "./middlewares/error-handler.middleware";
import { notFound } from "./middlewares/not-found.middleware";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/instruments", instumentsRouter);
app.use("/api/v1/orders", ordersRouter);

app.use(errorHandler);
app.use(notFound);

changePriceInEveryThreeSecond();

app.listen(PORT, () => {
  console.log(`server is running on port: http://localhost:${PORT}`);
});
