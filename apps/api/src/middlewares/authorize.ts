import type { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";
import { StatusCodes } from "http-status-codes";

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError("Insufficient permissions", StatusCodes.FORBIDDEN),
      );
    }
    next();
  };
}
