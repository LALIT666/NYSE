import type { Client } from "../types/client.types";

// connectionId -> Client
export const clients = new Map<string, Client>();
