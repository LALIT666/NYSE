import { WebSocketServer, type WebSocket } from "ws";
import { WS_PORT } from "./config/ws.config";
import { v4 as uuidv4 } from "uuid";
import type { Client } from "./types/client.types";
import { clients } from "./storage/clients.storage";
import { sendToClient } from "./helpers/send-to-client.helper";
import { handleClientMessage } from "./handlers/handle-client-message.handler";

const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", (ws: WebSocket) => {
  const connectionId = uuidv4();

  const client: Client = {
    id: connectionId,
    ws,
  };

  clients.set(connectionId, client);

  console.log(`✅ Client connected: ${connectionId} (total: ${clients.size})`);

  sendToClient(client, {
    type: "subscribed",
    data: {
      connectionId,
      message: "Connected to exchange WS",
    },
  });

  ws.on("message", (raw: Buffer) => {
    handleClientMessage(client, raw.toString());
  });
});

console.log(`🚀 Websocket server running on ws://localhost:${WS_PORT}`);
