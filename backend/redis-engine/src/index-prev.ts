import { client } from "./redis/main.client";
import { publisher } from "./redis/publisher.client";
import { MESSAGES_QUEUE } from "./config/redis.config";
import { processMessage } from "./router/process-message.router";
import type { IncomingMessage } from "./types/incoming-message.types";
import { pgPool } from "./postgres/postgres.pool";

const main = async (): Promise<void> => {
  try {
    await pgPool.query("SELECT 1");
    console.log("✅ TimescaleDB connected");
  } catch (err) {
    console.error("❌ TimescaleDB connection failed:", err);
    process.exit(1);
  }

  await client.connect();
  await publisher.connect();
  console.log("✅ Redis connected (main + publisher)");
  console.log("🚀 Engine started, waiting for messages...");

  while (true) {
    try {
      const result = await client.brPop(MESSAGES_QUEUE, 0);
      if (!result) continue;

      let msg: IncomingMessage;

      try {
        msg = JSON.parse(result.element) as IncomingMessage;
      } catch {
        console.error("Invalid JSON:", result.element);
        continue;
      }

      console.log(`📨 Received: ${msg.type} (clientId: ${msg.clientId})`);

      const response = await processMessage(msg);

      const responseQueue = `response-${msg.clientId}`;
      await client.lPush(responseQueue, JSON.stringify(response));
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
