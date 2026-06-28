import { subscriber } from "../redis/subscriber.client";

export const startRedisSubscriber = async (): Promise<void> => {
  await subscriber.connect();

  console.log("✅ Redis subscriber connected successfully");
};
