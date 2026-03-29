import type { NextFunction, Request, Response } from "express";
import * as bannerService from "../services/banner.service";
import { sendCreated, sendNoContent, sendSuccess } from "../utils/apiResponse";
import type { BannerQueryDto } from "../validators/banner.validator";

export async function listBanners(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { isActive } = req.query as unknown as BannerQueryDto;
    const banners = await bannerService.list({ isActive });
    sendSuccess(res, banners);
  } catch (err) {
    next(err);
  }
}

export async function createBanner(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const banner = await bannerService.create(req.body);
    sendCreated(res, banner, "Banner created successfully");
  } catch (err) {
    next(err);
  }
}

export async function deleteBanner(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await bannerService.remove(req.params.id);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
