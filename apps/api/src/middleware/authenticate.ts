import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "./errorHandler";

// Extend Express Request with typed user payload
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        role: string;
      };
      rawBody?: Buffer;
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(
      new AppError("Authentication required", StatusCodes.UNAUTHORIZED),
    );
  }

  const token = authHeader.slice(7);
  if (!token) {
    return next(
      new AppError("Authentication token is missing", StatusCodes.UNAUTHORIZED),
    );
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { sub: payload.sub as string, role: payload.role as string };
    next();
  } catch (err) {
    // Re-throw JWT errors so errorHandler can classify them
    next(err);
  }
}
