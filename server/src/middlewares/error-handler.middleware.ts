import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.status((err as any).status || 500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
}
