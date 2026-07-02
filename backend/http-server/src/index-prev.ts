// Main entry file - sab kuch yahan jod ke server start karo

import express from "express";
import { PORT } from "./config/app.config";
import { publisher, subscriber } from "./redis/redis.clients";

// Saare route files import karo
import authRoutes from "./routes/auth.routes";
import balanceRoutes from "./routes/balance.routes";
import orderRoutes from "./routes/order.routes";
import marketRoutes from "./routes/market.routes";
import userRoutes from "./routes/user.routes";
import klineRoutes from "./routes/klines.routes";

const app = express();

app.use(express.json());

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/balance", balanceRoutes);

app.use("/api/v1/order", orderRoutes);

app.use("/api/v1", marketRoutes);

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/klines", klineRoutes);

const start = async (): Promise<void> => {
  await publisher.connect();
  await subscriber.connect();
  console.log("✅ Redis connected (publisher + subscriber)");

  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
