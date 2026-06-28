import { channelSubscribers, clients } from "../storage/clients.storage";
import type { OutgoingMessage } from "../types/outgoing-message.types";

export const broadcastToChannel = (channel: string, data: unknown): void => {
  const subscribers = channelSubscribers.get(channel);

  if (!subscribers || subscribers.size === 0) {
    return;
  }

  const message: OutgoingMessage = {
    stream: channel,
    data,
  };

  const payload = JSON.stringify(message);

  subscribers.forEach((connectionId) => {
    const client = clients.get(connectionId);

    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
};
