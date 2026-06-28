import { createClient, type RedisClientType } from "redis";

import { REDIS_URL, MESSAGES_QUEUE } from "./config/config";
import type { IncomingMessage } from "./types/types";
import { processMessage } from "./router/router";

// ==================== REDIS LOOP ====================
const main = async (): Promise<void> => {
  const client: RedisClientType = createClient({ url: REDIS_URL });

  client.on("error", (err) => console.error("Redis error:", err));

  await client.connect();
  console.log("✅ Redis connected");
  console.log("🚀 Engine started, waiting for messages...");

  // Infinite loop - blocking pop
  while (true) {
    try {
      // BRPOP - blocking right pop, 0 = infinite wait
      const result = await client.brPop(MESSAGES_QUEUE, 0);
      if (!result) continue;

      const raw = result.element;
      let msg: IncomingMessage;

      try {
        msg = JSON.parse(raw) as IncomingMessage;
      } catch {
        console.error("Invalid JSON in message:", raw);
        continue;
      }

      console.log(`📨 Received: ${msg.type} (clientId: ${msg.clientId})`);

      // Process karo
      const response = processMessage(msg);

      // Response wapas bhejo us specific clientId queue me
      const responseQueue = `response-${msg.clientId}`;
      await client.lPush(responseQueue, JSON.stringify(response));

      // Optional: response queue expire kar do (memory leak prevent)
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
