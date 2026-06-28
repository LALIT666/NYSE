import { startRedisSubscriber } from "./startup/start-redis-subscriber";
import { startWebSocketServer } from "./startup/start-websocket-server";

const start = async (): Promise<void> => {
  await startRedisSubscriber();
  startWebSocketServer();
};

start().catch((err) => {
  console.error("Fatal WS STARTUP ERROR: ", err);

  process.exit(1);
});
