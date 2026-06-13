import { email, z } from "zod";

export const SignupSchema = z.object({
  email: z.string().email("Invalid email id"),
  password: z.string().min(8, "Password must me atleast 6 charactes"),
});

export type SignupInput = z.infer<typeof SignupSchema>;
