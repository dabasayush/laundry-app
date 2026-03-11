import type { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";
import { StatusCodes } from "http-status-codes";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  // Unexpected / programmer errors
  logger.error("Unhandled error", { error: err });
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "An unexpected error occurred",
  });
}
