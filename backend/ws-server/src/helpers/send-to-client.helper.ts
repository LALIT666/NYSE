import type { Client } from "../types/client.types";
import type { OutgoingMessage } from "../types/outgoing-message.types";
import { WebSocket } from "ws";

export const sendToClient = (
  client: Client,
  message: OutgoingMessage,
): void => {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
};
