import bcrypt from "bcryptjs";
import express from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import type { Response, Request, NextFunction } from "express";

const app = express();
app.use(express.json());

// ==================== CONFIG ====================
const PORT = 3000;
const JWT_SECRET = "super-secret-key-from.env file";

// ==================== TYPES ====================
interface User {
  userId: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

interface JwtPayload {
  userId: string;
  email: string;
}

// Express Request me user attach karne ke liye
interface AuthRequest extends Request {
  user?: JwtPayload;
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

//signin schema -- me yaha par same signup wali use kar sakata tha but koi nahi practice hai
const SigninSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type SigninInput = z.infer<typeof SigninSchema>;

type SignupInput = z.infer<typeof SignupSchema>;

// ==================== MIDDLEWARE ====================

const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token missing" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token!, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
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

// 2. Signin
app.post("/api/v1/auth/signin", async (req, res): Promise<void> => {
  const parsed = SigninSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid input", errors: parsed.error.issues });
    return;
  }

  const { email, password }: SigninInput = parsed.data;
  const user = users.get(email);

  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const verfingPassword = await bcrypt.compare(password, user.passwordHash);
  if (!verfingPassword) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const payload: JwtPayload = { userId: user.userId, email: user.email };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

  res.json({ token });
});

// 3. Get current user
app.get(
  "/api/v1/auth/me",
  authMiddleware,
  (req: AuthRequest, res: Response): void => {
    //ye wahi hai jo authmidleware se aa rahi hai okay
    const user = usersById.get(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({
      userId: user.userId,
      email: user.email,
      createdAt: user.createdAt,
    });
  },
);
