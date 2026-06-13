import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/config";
import type { AuthRequest, JwtPayload } from "../types-interfaces/types";

export const authMiddleware = (
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
    const decode = jwt.verify(token!, JWT_SECRET) as JwtPayload;

    req.user = decode;

    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
