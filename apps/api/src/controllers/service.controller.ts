import type { Request, Response, NextFunction } from "express";
import * as serviceService from "../services/service.service";
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} from "../utils/apiResponse";

export async function listServices(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
    } = req.query as {
      page?: number;
      limit?: number;
      isActive?: boolean;
    };
    const { services, total } = await serviceService.list({
      page: Number(page),
      limit: Number(limit),
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
    });
    sendPaginated(res, services, {
      page: Number(page),
      limit: Number(limit),
      total,
    });
  } catch (err) {
    next(err);
  }
}

export async function getService(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const service = await serviceService.findById(req.params.id);
    sendSuccess(res, service);
  } catch (err) {
    next(err);
  }
}

export async function createService(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const service = await serviceService.create(req.body);
    sendCreated(res, service, "Service created successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateService(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const service = await serviceService.update(req.params.id, req.body);
    sendSuccess(res, service, 200, "Service updated");
  } catch (err) {
    next(err);
  }
}

export async function deleteService(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await serviceService.remove(req.params.id);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
