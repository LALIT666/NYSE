import z from "zod";

export const SignupSchema = z.object({
  email: z.string().email("Invalid email id"),
  password: z.string().min(8, "Password must me atleast 6 charactes"),
});

export const SigninSchema = z.object({
  email: z.string().email("Invalid email id"),
  password: z.string().min(8, "Password must me atleast 6 charactes"),
});

export const DepositSchema = z.object({
  asset: z.enum(["INR", "TATA", "PAYTM", "ZOMATO"]),
  amount: z.number().positive(),
});

export const WithdrawSchema = z.object({
  asset: z.enum(["INR", "TATA", "PAYTM", "ZOMATO"]),
  amount: z.number().positive(),
});

export const OrderSchema = z.object({
  kind: z.enum(["buy", "sell"]),

  type: z.enum(["limit", "market"]),

  price: z.number().positive(),

  quantity: z.number().positive(),

  market: z.enum(["TATA_INR", "PAYTM_INR", "ZOMATO_INR"]),
});
export type SignupInput = z.infer<typeof SignupSchema>;
export type SigninInput = z.infer<typeof SigninSchema>;
export type DepositInput = z.infer<typeof DepositSchema>;
export type WithdrawInput = z.infer<typeof WithdrawSchema>;
export type OrderInput = z.infer<typeof OrderSchema>;
