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
export type SignupInput = z.infer<typeof SignupSchema>;
export type SigninInput = z.infer<typeof SigninSchema>;
export type DepositInput = z.infer<typeof DepositSchema>;
