import { validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

export function validate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
    return;
  }
  next();
}
