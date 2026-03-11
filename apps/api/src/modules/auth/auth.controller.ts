import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as authService from "./auth.service";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await authService.register(req.body);
    res.status(StatusCodes.CREATED).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier, password } = req.body;
    const result = await authService.login(identifier, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const tokens = await authService.rotateRefreshToken(req.body.refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.revokeAllUserTokens(req.user!.sub);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}
