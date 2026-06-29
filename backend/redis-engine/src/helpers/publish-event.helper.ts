// Redis pub/sub channel pe event publish karna
// WebSocket server in events ko sun ke clients ko bhejega

import { publisher } from "../redis/publisher.client";

// channel jaise: "depth@TATA_INR", "trades@TATA_INR", "orders@user-123"
// data: jo bhi bhejnaa hai (object)
export const publishEvent = async (
  channel: string,
  data: unknown,
): Promise<void> => {
  try {
    // Redis PUBLISH command - channel pe message daal do
    await publisher.publish(channel, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to publish to ${channel}:`, err);
  }
};
