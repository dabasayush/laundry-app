import type { Request, Response, NextFunction } from "express";
import * as adminService from "../services/admin.service";
import { sendSuccess } from "../utils/apiResponse";

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = await adminService.getAdminProfile(req.user!.sub);
    sendSuccess(res, admin, 200, "Admin profile retrieved");
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = await adminService.updateAdminProfile(
      req.user!.sub,
      req.body,
    );
    sendSuccess(res, admin, 200, "Profile updated successfully");
  } catch (err) {
    next(err);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;
    await adminService.changeAdminPassword(
      req.user!.sub,
      currentPassword,
      newPassword,
    );
    sendSuccess(res, null, 200, "Password changed successfully");
  } catch (err) {
    next(err);
  }
}
