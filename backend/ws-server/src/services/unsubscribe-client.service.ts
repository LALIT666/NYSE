import { sendToClient } from "../helpers/send-to-client.helper";
import { channelSubscribers } from "../storage/clients.storage";
import type { Client } from "../types/client.types";

export const unsubscribeClient = (client: Client, channels: string[]): void => {
  channels.forEach((channel) => {
    client.subscriptions.delete(channel);

    const subs = channelSubscribers.get(channel);

    if (subs) {
      subs.delete(client.id);

      if (subs.size === 0) {
        channelSubscribers.delete(channel);
      }
    }
  });

  sendToClient(client, {
    type: "unsubscribed",
    data: { channels },
  });
};
