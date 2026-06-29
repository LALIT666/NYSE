import { client } from "./redis/main.client";
import { MESSAGES_QUEUE } from "./config/redis.config";
import type { EngineResponse } from "./types/engine-response.types";

const main = async (): Promise<void> => {
  await client.connect();
  console.log("✅ Redis connected");
  console.log("🚀 Engine started, waiting for messages...");

  while (true) {
    try {
      const result = await client.brPop(MESSAGES_QUEUE, 0);
      if (!result) continue;

      // Raw string ko JSON me parse karo
      let msg: { type: string; clientId: string; data: unknown };

      try {
        msg = JSON.parse(result.element);
      } catch {
        // Agar galat JSON aaya toh skip karo
        console.error("Invalid JSON:", result.element);
        continue;
      }

      console.log(`📨 Received: ${msg.type} (clientId: ${msg.clientId})`);

      // Abhi har message ke liye ek dummy response bhejenge
      // Baad me actual handlers banayenge
      const response: EngineResponse = {
        ok: false,
        message: "Not implemented yet",
      };

      // Response us client ke specific queue me daalo
      // "response-{clientId}" = har client ka apna response queue
      const responseQueue = `response-${msg.clientId}`;

      // LPUSH: Queue me response daal do
      await client.lPush(responseQueue, JSON.stringify(response));

      // 30 second baad ye queue automatically delete ho jayega
      // Taaki memory leak na ho agar koi response uthaye hi nahi
      await client.expire(responseQueue, 30);

      console.log(`✅ Responded to ${msg.clientId}`);
    } catch (err) {
      console.error("Engine loop error:", err);
    }
  }
};

main().catch((err) => {
  console.error("Fatal engine error:", err);
  process.exit(1);
});
