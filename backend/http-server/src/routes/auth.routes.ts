// Signup, Signin aur Profile dekhne ke routes

import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { JWT_SECRET } from "../config/app.config";
import { SignupSchema, SigninSchema } from "../schemas/auth.schema";
import { users, usersById } from "../storage/users.storage";
import { sendAndWait } from "../redis/send-and-wait";
import { authMiddleware } from "../middleware/auth.middleware";
import type { User } from "../types/user.types";
import type { JwtPayload, AuthRequest } from "../types/auth.types";

const router = Router();

router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  const parsed = SignupSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.issues,
    });
    return;
  }

  const { email, password } = parsed.data;

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

  await sendAndWait("INIT_BALANCE", { userId: newUser.userId });

  res.status(201).json({
    message: "User created",
    userId: newUser.userId,
  });
});

router.post("/signin", async (req: Request, res: Response): Promise<void> => {
  const parsed = SigninSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.issues,
    });
    return;
  }

  const { email, password } = parsed.data;

  const user = users.get(email);

  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);

  if (!ok) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const payload: JwtPayload = {
    userId: user.userId,
    email: user.email,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

  res.json({ token });
});

router.get("/me", authMiddleware, (req: AuthRequest, res: Response): void => {
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
});

export default router;
