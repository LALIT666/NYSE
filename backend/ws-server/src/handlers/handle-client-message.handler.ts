import { sendToClient } from "../helpers/send-to-client.helper";
import type { Client } from "../types/client.types";
import type { IncomingMessage } from "../types/incoming-message.types";

export const handleClientMessage = (client: Client, raw: string): void => {
  let msg: IncomingMessage;

  try {
    msg = JSON.parse(raw) as IncomingMessage;
  } catch {
    sendToClient(client, {
      type: "error",
      message: "Invalid JSON",
    });

    return;
  }

  switch (msg.method) {
    case "PING":
      sendToClient(client, { type: "pong" });
      break;

    default:
      sendToClient(client, {
        type: "error",
        message: "Unknown method",
      });
  }
};
