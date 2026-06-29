import { createClient, type RedisClientType } from "redis";
import { REDIS_URL } from "../config/redis.config";

export const client: RedisClientType = createClient({ url: REDIS_URL });

client.on("error", (err) => console.error("Main Redis error:", err));
