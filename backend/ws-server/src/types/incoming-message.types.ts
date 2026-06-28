export interface IncomingMessage {
  method: "SUBSCRIBE" | "UNSUBSCRIBE" | "PING";
  params?: string[];
}
