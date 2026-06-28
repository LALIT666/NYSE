import { WebSocketServer } from "ws";
import { WS_PORT } from "./config/ws.config";

const wss = new WebSocketServer({ port: WS_PORT });

console.log(`🚀 Websocket server running on ws://localhost:${WS_PORT}`);
