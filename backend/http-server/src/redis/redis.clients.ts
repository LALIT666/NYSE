// Redis ke do clients banaye hai
// Do kyun? Kyunki ek message bhejega (publisher)
// aur ek response ka wait karega blocking tarike se (subscriber)
// Ek hi client se dono kaam nahi ho sakta kyunki blocking pop
// poore client ko rok deta hai

import { createClient, type RedisClientType } from "redis";
import { REDIS_URL } from "../config/redis.config";

// publisher: Isse hum Engine ko messages bhejenge (LPUSH)
export const publisher: RedisClientType = createClient({ url: REDIS_URL });

// subscriber: Isse hum Engine ka response wait karenge (BRPOP)
export const subscriber: RedisClientType = createClient({ url: REDIS_URL });

// Agar Redis me koi error aaye toh console me dikhao
// Ye event listener hai - jab bhi error aaye tab chalega
publisher.on("error", (err) => console.error("Publisher error:", err));
subscriber.on("error", (err) => console.error("Subscriber error:", err));
