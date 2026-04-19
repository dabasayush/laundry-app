import type { Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleError(
  error: unknown,
  res: Response,
  _next: NextFunction,
): void {
  const appError = error instanceof AppError ? error : new AppError("Internal Server Error", 500);

  res.status(appError.statusCode).json({
    success: false,
    message: appError.message,
    ...(process.env.NODE_ENV === "development" && { stack: error instanceof Error ? error.stack : undefined }),
  });
}
