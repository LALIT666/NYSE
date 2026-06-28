import { sendToClient } from "../helpers/send-to-client.helper";
import { subscribeClient } from "../services/subscribe-client.service";
import { unsubscribeClient } from "../services/unsubscribe-client.service";
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
    case "SUBSCRIBE":
      if (!msg.params || !Array.isArray(msg.params)) {
        sendToClient(client, {
          type: "error",
          message: "params required",
        });

        return;
      }

      subscribeClient(client, msg.params);
      break;

    case "UNSUBSCRIBE":
      if (!msg.params || !Array.isArray(msg.params)) {
        sendToClient(client, {
          type: "error",
          message: "params required",
        });

        return;
      }

      unsubscribeClient(client, msg.params);
      break;

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
