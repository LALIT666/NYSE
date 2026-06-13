import type { User } from "./../types-interfaces/types";
import { email } from "zod";
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { JWT_SECRET } from "../config/config";
import { SignupSchema } from "../zod-schemas/zod";
import { userById, users } from "../data/in-memory-database";
import { initBalance } from "../helper/helpers";

const router = Router();

router.post("/singup", async (req: Request, res: Response) => {
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
