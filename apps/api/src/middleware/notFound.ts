import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export function notFound(req: Request, res: Response): void {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
}
