import { createClient, type RedisClientType } from "redis";
import { REDIS_URL } from "../config/redis.config";

export const subscriber: RedisClientType = createClient({ url: REDIS_URL });

subscriber.on("error", (err) => {
  console.error("Redis subscriber error: ", err);
});
