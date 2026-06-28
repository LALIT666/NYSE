import { z } from "zod";

export const DepositSchema = z.object({
  asset: z.enum(["INR", "TATA", "PAYTM", "ZOMATO"]),
  amount: z.number().positive(),
});

export const WithdrawSchema = z.object({
  asset: z.enum(["INR", "TATA", "PAYTM", "ZOMATO"]),
  amount: z.number().positive(),
});
