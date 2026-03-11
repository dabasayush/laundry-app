import type { Request, Response, NextFunction } from "express";
import * as serviceItemService from "../services/service-item.service";
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} from "../utils/apiResponse";
import type { ServiceItemQueryDto } from "../validators/service-item.validator";

export async function listItems(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit, serviceId, isActive } =
      req.query as unknown as ServiceItemQueryDto;
    const { items, total } = await serviceItemService.list({
      page,
      limit,
      serviceId,
      isActive,
    });
    sendPaginated(res, items, { page, limit, total });
  } catch (err) {
    next(err);
  }
}

export async function getItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const item = await serviceItemService.findById(req.params.id);
    sendSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function createItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const item = await serviceItemService.create(req.body);
    sendCreated(res, item, "Service item created successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const item = await serviceItemService.update(req.params.id, req.body);
    sendSuccess(res, item, 200, "Service item updated");
  } catch (err) {
    next(err);
  }
}

export async function deleteItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await serviceItemService.remove(req.params.id);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
