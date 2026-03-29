import type { Request, Response, NextFunction } from "express";
import * as itemService from "../services/item.service";
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} from "../utils/apiResponse";
import type { ItemQueryDto } from "../validators/item.validator";

export async function listItems(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit, isActive } = req.query as unknown as ItemQueryDto;
    const { items, total } = await itemService.list({ page, limit, isActive });
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
    const item = await itemService.findById(req.params.id);
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
    const item = await itemService.create(req.body);
    sendCreated(res, item, "Item created successfully");
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
    const item = await itemService.update(req.params.id, req.body);
    sendSuccess(res, item, 200, "Item updated");
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
    await itemService.remove(req.params.id);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

export async function assignServicesToItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const item = await itemService.assignServices(req.params.id, req.body);
    sendSuccess(res, item, 200, "Services assigned successfully");
  } catch (err) {
    next(err);
  }
}
