import { channel } from "node:diagnostics_channel";
import type { Client } from "../types/client.types";
import { channelSubscribers, clients } from "../storage/clients.storage";

export const cleanupClient = (client: Client): void => {
  client.subscriptions.forEach((channel) => {
    const subs = channelSubscribers.get(channel);

    if (subs) {
      subs.delete(client.id);

      if (subs.size === 0) {
        channelSubscribers.delete(channel);
      }
    }
  });

  clients.delete(client.id);

  console.log(`❌ Client ${client.id} disconnected (cleanup done)`);
};
