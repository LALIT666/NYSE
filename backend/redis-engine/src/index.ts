import { client } from "./redis/main.client";
import { MESSAGES_QUEUE } from "./config/redis.config";

const main = async (): Promise<void> => {
  await client.connect();
  console.log("✅ Redis connected");
  console.log("🚀 Engine started, waiting for messages...");

  while (true) {
    try {
      const result = await client.brPop(MESSAGES_QUEUE, 0);

      if (!result) continue;

      console.log("📨 Received:", result.element);
    } catch (err) {
      console.error("Engine loop error:", err);
    }
  }
};

main().catch((err) => {
  console.error("Fatal engine error:", err);
  process.exit(1);
});
