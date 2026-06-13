import type { User } from "./../types-interfaces/types";

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";

import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import {
  SigninSchema,
  SignupSchema,
  type SigninInput,
} from "../zod-schemas/zod";
import { userById, users } from "../data/in-memory-database";
import { initBalance } from "../helper/helpers";
import { type JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/config";

const router = Router();

//Sign up route

router.post("/singup", async (req: Request, res: Response): Promise<void> => {
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

  userById.set(newUser.userId, newUser);

  initBalance(newUser.userId);

  res.status(201).json({
    message: "User created",
    userId: newUser.userId,
  });
});

//Sign in

router.post("/sigin", async (req: Request, res: Response): Promise<void> => {
  const parsed = SigninSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.issues,
    });
    return;
  }

  const { email, password }: SigninInput = parsed.data;

  const user = users.get(email);

  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);

  if (!ok) {
    res
      .status(401)
      .json({ message: "Ivalid credentials(password is invalid)" });
    return;
  }

  const payload: JwtPayload = {
    userId: user.userId,
    email: user.email,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

  res.json({ token });
});
