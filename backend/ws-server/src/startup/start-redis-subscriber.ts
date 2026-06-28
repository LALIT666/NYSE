import { REDIS_CHANNEL_PATTERN } from "../config/redis.config";
import { subscriber } from "../redis/subscriber.client";
import { broadcastToChannel } from "../helpers/broadcast-to-channel.helper";

export const startRedisSubscriber = async (): Promise<void> => {
  await subscriber.connect();

  console.log("✅ Redis subscriber connected successfully");

  await subscriber.pSubscribe(REDIS_CHANNEL_PATTERN, (message, channel) => {
    try {
      const data = JSON.parse(message);
      broadcastToChannel(channel, data);
    } catch (err) {
      console.error("Error broadcasting: ", err);
    }
  });
  console.log(
    `✅ Subscribed to all channels (pattern: ${REDIS_CHANNEL_PATTERN})`,
  );
};
