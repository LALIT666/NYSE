import { z } from "zod";

export const OrderSchema = z.object({
  kind: z.enum(["buy", "sell"]),
  type: z.enum(["limit", "market"]),
  price: z.number().positive(),
  quantity: z.number().positive(),
  market: z.enum(["TATA_INR", "PAYTM_INR", "ZOMATO_INR"]),
});
