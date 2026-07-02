import { z } from "zod";

export const KlineQuerySchema = z.object({
  interval: z.enum(["1m", "5m", "1h", "1d"]).default("1h"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100),
});
