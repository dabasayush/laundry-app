import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../modules/auth/auth.service";
import { AppError } from "./errorHandler";
import { StatusCodes } from "http-status-codes";

// Extend Express Request with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: { sub: string; role: string };
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(
      new AppError("Authentication required", StatusCodes.UNAUTHORIZED),
    );
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = { sub: payload.sub as string, role: payload.role as string };
    next();
  } catch {
    next(new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED));
  }
}
