// Ye alag Redis client hai sirf events publish karne ke liye
// Main client BRPOP me blocked rehta hai
// Isliye publish karne ke liye alag client chahiye

import { createClient, type RedisClientType } from "redis";
import { REDIS_URL } from "../config/redis.config";

export const publisher: RedisClientType = createClient({ url: REDIS_URL });

publisher.on("error", (err) => console.error("Publisher Redis error:", err));
