import { sendToClient } from "../helpers/send-to-client.helper";
import { channelSubscribers } from "../storage/clients.storage";
import type { Client } from "../types/client.types";

export const subscribeClient = (client: Client, channels: string[]): void => {
  channels.forEach((channel) => {
    client.subscriptions.add(channel);

    if (!channelSubscribers.has(channel)) {
      channelSubscribers.set(channel, new Set());
    }

    channelSubscribers.get(channel)!.add(client.id);
  });

  sendToClient(client, {
    type: "subscribed",
    data: { channels },
  });

  console.log(`📡 Client ${client.id} subscribed to: `, channels);
};
