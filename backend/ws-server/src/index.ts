import { WebSocketServer, type WebSocket } from "ws";
import { WS_PORT } from "./config/ws.config";
import { v4 as uuidv4 } from "uuid";
import type { Client } from "./types/client.types";
import { clients } from "./storage/clients.storage";

const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", (ws: WebSocket) => {
  const connectionId = uuidv4();

  const client: Client = {
    id: connectionId,
    ws,
  };

  clients.set(connectionId, client);

  console.log(`✅ Client connected: ${connectionId} (total: ${clients.size})`);
});

console.log(`🚀 Websocket server running on ws://localhost:${WS_PORT}`);
