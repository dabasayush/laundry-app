import type { Request, Response, NextFunction } from "express";
import * as productService from "../services/product.service";
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} from "../utils/apiResponse";
import type { ProductQueryDto } from "../validators/product.validator";

export async function listProducts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {
      page = 1,
      limit = 20,
      isActive,
    } = req.query as unknown as ProductQueryDto;
    const { products, total } = await productService.list({
      page: Number(page),
      limit: Number(limit),
      isActive,
    });
    sendPaginated(res, products, {
      page: Number(page),
      limit: Number(limit),
      total,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await productService.findById(req.params.id);
    sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
}

export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await productService.create(req.body);
    sendCreated(res, product, "Product created successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await productService.update(req.params.id, req.body);
    sendSuccess(res, product, 200, "Product updated");
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await productService.remove(req.params.id);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
