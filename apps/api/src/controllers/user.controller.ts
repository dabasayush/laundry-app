import type { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";
import {
  sendSuccess,
  sendPaginated,
  sendNoContent,
} from "../utils/apiResponse";

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.findById(req.user!.sub);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.updateMe(req.user!.sub, req.body);
    sendSuccess(res, user, 200, "Profile updated");
  } catch (err) {
    next(err);
  }
}

export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {
      page = 1,
      limit = 10,
      role,
    } = req.query as {
      page?: number;
      limit?: number;
      role?: string;
    };
    const { users, total } = await userService.listAll({
      page: Number(page),
      limit: Number(limit),
      role,
    });
    sendPaginated(res, users, {
      page: Number(page),
      limit: Number(limit),
      total,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.findById(req.params.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function getUserByPhone(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { mobile } = req.query;
    if (!mobile || typeof mobile !== "string") {
      sendSuccess(res, null, 200, "No user found");
      return;
    }

    const user = await userService.findByPhone(mobile);
    sendSuccess(res, user, 200, user ? "User found" : "User not found");
  } catch (err) {
    next(err);
  }
}

export async function blockUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await userService.blockUser(req.params.id);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

export async function unblockUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await userService.unblockUser(req.params.id);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await userService.deleteUser(req.params.id);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
