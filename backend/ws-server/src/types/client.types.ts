import type { WebSocket } from "ws";

export interface Client {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>;
}
