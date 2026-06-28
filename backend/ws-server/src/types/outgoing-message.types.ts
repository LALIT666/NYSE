export interface OutgoingMessage {
  stream?: string;
  data?: unknown;
  type?: "subscribed" | "unsubscribed" | "error" | "pong";
  message?: string;
}
