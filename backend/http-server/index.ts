import bcrypt from "bcryptjs";
import express from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

// ==================== CONFIG ====================
const PORT = 3000;

// ==================== TYPES ====================
interface User {
  userId: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

// ==================== IN-MEMORY STORAGE ====================

const users = new Map<string, User>(); // key: email
const usersById = new Map<string, User>(); // key: userId

// ==================== Zod Schema ====================

//Zod Schema

//Sign up
const SignupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be 6 charater long"),
});

type SignupInput = z.infer<typeof SignupSchema>;

// ========================================

//SIGN UP ENDPOINT
app.post("/api/v1/auth/signup", async (req, res): Promise<void> => {
  const parsedUserData = SignupSchema.safeParse(req.body);
  if (!parsedUserData.success) {
    res
      .status(400)
      .json({ message: "Invalid input", errors: parsedUserData.error.issues });
    return;
  }

  const { email, password }: SignupInput = parsedUserData.data;

  if (users.has(email)) {
    res.status(409).json({ message: "User already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser: User = {
    userId: uuidv4(),
    email,
    passwordHash,
    createdAt: new Date(),
  };

  users.set(email, newUser);
  usersById.set(newUser.userId, newUser);

  res.status(201).json({
    message: "User created",
    userId: newUser.userId,
  });
});
