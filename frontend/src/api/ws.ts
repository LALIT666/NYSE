type EventHandler = (data: any) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers = new Map<string, Set<EventHandler>>();

  private subscribedChannels = new Set<string>();

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private isConnecting = false;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;

    this.isConnecting = true;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("WS connected");
      this.isConnecting = false;

      if (this.subscribedChannels.size > 0) {
        this.send({
          method: "SUBSCRIBE",
          params: Array.from(this.subscribedChannels),
        });
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.stream && msg.data !== undefined) {
          const handlers = this.handlers.get(msg.stream);
          handlers?.forEach((fn) => fn(msg.data));
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    this.ws.onclose = () => {
      console.log("WS disconnected, reconnecting in 2s...");
      this.isConnecting = false;
      this.ws = null;
      this.reconnectTimer = setTimeout(() => this.connect(), 2000);
    };

    this.ws.onerror = (err) => {
      console.error("WS error:", err);
    };
  }

  private send(msg: { method: string; params?: string[] }): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  subscribe(channel: string, handler: EventHandler): () => void {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }
    this.handlers.get(channel)!.add(handler);

    if (!this.subscribedChannels.has(channel)) {
      this.subscribedChannels.add(channel);
      this.send({ method: "SUBSCRIBE", params: [channel] });
    }

    return () => this.unsubscribe(channel, handler);
  }

  unsubscribe(channel: string, handler: EventHandler): void {
    const handlers = this.handlers.get(channel);
    if (!handlers) return;
    handlers.delete(handler);

    if (handlers.size === 0) {
      this.handlers.delete(channel);
      this.subscribedChannels.delete(channel);
      this.send({ method: "UNSUBSCRIBE", params: [channel] });
    }
  }
}

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:3001";
export const wsManager = new WebSocketManager(WS_URL);
