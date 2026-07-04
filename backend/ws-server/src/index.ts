import { WebSocketServer, WebSocket } from "ws";
import { createClient, type RedisClientType } from "redis";
import { v4 as uuidv4 } from "uuid";

// ==================== CONFIG ====================
const WS_PORT = 3001;
const REDIS_URL = "redis://localhost:6379";

// ==================== TYPES ====================
interface IncomingMessage {
  method: "SUBSCRIBE" | "UNSUBSCRIBE" | "PING";
  params?: string[];
}

interface OutgoingMessage {
  stream?: string;
  data?: unknown;
  type?: "subscribed" | "unsubscribed" | "error" | "pong";
  message?: string;
}

interface Client {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>;
}

// ==================== STATE ====================
// connectionId → Client
const clients = new Map<string, Client>();

// channel → Set<connectionId>
const channelSubscribers = new Map<string, Set<string>>();

// ==================== REDIS SUBSCRIBER ====================
const subscriber: RedisClientType = createClient({ url: REDIS_URL });

subscriber.on("error", (err) => console.error("Redis subscriber error:", err));

// ==================== HELPERS ====================
const sendToClient = (client: Client, message: OutgoingMessage): void => {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
};

const broadcastToChannel = (channel: string, data: unknown): void => {
  const subscribers = channelSubscribers.get(channel);
  if (!subscribers || subscribers.size === 0) return;

  const message: OutgoingMessage = { stream: channel, data };
  const payload = JSON.stringify(message);

  subscribers.forEach((connectionId) => {
    const client = clients.get(connectionId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
};

const subscribeClient = (client: Client, channels: string[]): void => {
  channels.forEach((channel) => {
    // Client ke subscriptions me add
    client.subscriptions.add(channel);

    // Channel ke subscribers me add
    if (!channelSubscribers.has(channel)) {
      channelSubscribers.set(channel, new Set());
    }
    channelSubscribers.get(channel)!.add(client.id);
  });

  sendToClient(client, {
    type: "subscribed",
    data: { channels },
  });

  console.log(`📡 Client ${client.id} subscribed to:`, channels);
};

const unsubscribeClient = (client: Client, channels: string[]): void => {
  channels.forEach((channel) => {
    client.subscriptions.delete(channel);

    const subs = channelSubscribers.get(channel);
    if (subs) {
      subs.delete(client.id);
      if (subs.size === 0) channelSubscribers.delete(channel);
    }
  });

  sendToClient(client, {
    type: "unsubscribed",
    data: { channels },
  });
};

const cleanupClient = (client: Client): void => {
  // Saare channels se hatao
  client.subscriptions.forEach((channel) => {
    const subs = channelSubscribers.get(channel);
    if (subs) {
      subs.delete(client.id);
      if (subs.size === 0) channelSubscribers.delete(channel);
    }
  });

  clients.delete(client.id);
  console.log(`❌ Client ${client.id} disconnected (cleanup done)`);
};

// ==================== MESSAGE HANDLER ====================
const handleClientMessage = (client: Client, raw: string): void => {
  let msg: IncomingMessage;

  try {
    msg = JSON.parse(raw) as IncomingMessage;
  } catch {
    sendToClient(client, { type: "error", message: "Invalid JSON" });
    return;
  }

  switch (msg.method) {
    case "SUBSCRIBE":
      if (!msg.params || !Array.isArray(msg.params)) {
        sendToClient(client, { type: "error", message: "params required" });
        return;
      }
      subscribeClient(client, msg.params);
      break;

    case "UNSUBSCRIBE":
      if (!msg.params || !Array.isArray(msg.params)) {
        sendToClient(client, { type: "error", message: "params required" });
        return;
      }
      unsubscribeClient(client, msg.params);
      break;

    case "PING":
      sendToClient(client, { type: "pong" });
      break;

    default:
      sendToClient(client, { type: "error", message: "Unknown method" });
  }
};

// ==================== STARTUP ====================
const start = async (): Promise<void> => {
  // Redis connect
  await subscriber.connect();
  console.log("✅ Redis subscriber connected");

  // Pattern subscribe - saare channels ko sun lo
  // Channels jaise: depth@TATA_INR, trades@TATA_INR, orders@user-xyz
  await subscriber.pSubscribe("*@*", (message, channel) => {
    try {
      const data = JSON.parse(message);
      broadcastToChannel(channel, data);
    } catch (err) {
      console.error("Error broadcasting:", err);
    }
  });

  console.log("✅ Subscribed to all channels (pattern: *@*)");

  // WebSocket server start
  const wss = new WebSocketServer({ port: WS_PORT });

  wss.on("connection", (ws: WebSocket) => {
    const connectionId = uuidv4();
    const client: Client = {
      id: connectionId,
      ws,
      subscriptions: new Set(),
    };

    clients.set(connectionId, client);
    console.log(
      `✅ Client connected: ${connectionId} (total: ${clients.size})`,
    );

    // Welcome message
    sendToClient(client, {
      type: "subscribed",
      data: { connectionId, message: "Connected to exchange WS" },
    });

    ws.on("message", (raw: Buffer) => {
      handleClientMessage(client, raw.toString());
    });

    ws.on("close", () => {
      cleanupClient(client);
    });

    ws.on("error", (err) => {
      console.error(`Client ${connectionId} error:`, err);
      cleanupClient(client);
    });
  });

  console.log(`🚀 WebSocket server running on ws://localhost:${WS_PORT}`);
};

start().catch((err) => {
  console.error("Fatal WS startup error:", err);
  process.exit(1);
});
