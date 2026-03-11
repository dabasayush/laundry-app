import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "./errorHandler";

/**
 * Role-based access control middleware.
 * Must be used after `authenticate`.
 *
 * @example
 * router.patch('/status', authenticate, authorize('admin', 'driver'), handler)
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new AppError("Authentication required", StatusCodes.UNAUTHORIZED),
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${allowedRoles.join(", ")}`,
          StatusCodes.FORBIDDEN,
        ),
      );
    }

    next();
  };
}
