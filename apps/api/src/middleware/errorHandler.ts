import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import { logger } from "../config/logger";

// ── Operational error class ───────────────────────────────────────────────────
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Prisma error → AppError translation ──────────────────────────────────────
function handlePrismaError(
  err: Prisma.PrismaClientKnownRequestError,
): AppError {
  switch (err.code) {
    case "P2002":
      return new AppError(
        `A record with that ${(err.meta?.target as string[])?.join(", ")} already exists`,
        StatusCodes.CONFLICT,
      );
    case "P2025":
      return new AppError("Record not found", StatusCodes.NOT_FOUND);
    case "P2003":
      return new AppError(
        "Related record not found or foreign key constraint failed",
        StatusCodes.BAD_REQUEST,
      );
    case "P2014":
      return new AppError(
        "The change would violate a required relation",
        StatusCodes.BAD_REQUEST,
      );
    default:
      logger.error("Unhandled Prisma error", {
        code: err.code,
        meta: err.meta,
      });
      return new AppError(
        "Database operation failed",
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
  }
}

// ── Global error handler ──────────────────────────────────────────────────────
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: "Validation failed",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const appErr = handlePrismaError(err);
    res
      .status(appErr.statusCode)
      .json({ success: false, message: appErr.message });
    return;
  }

  // Prisma validation errors (bad data shape)
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Invalid data provided to database operation",
    });
    return;
  }

  // Operational errors (AppError)
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ success: false, message: "Invalid token" });
    return;
  }
  if (err.name === "TokenExpiredError") {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ success: false, message: "Token has expired" });
    return;
  }

  // Unknown / programmer errors — never leak details in production
  logger.error("Unhandled error", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  });
}
