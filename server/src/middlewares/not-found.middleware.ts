import type { Request, Response, NextFunction } from "express";

export function notFound(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.status((err as any).status || 404).json({
    success: false,
    message: "Route not found",
  });
}
