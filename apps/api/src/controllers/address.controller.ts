import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { sendSuccess, sendCreated, sendNoContent } from "../utils/apiResponse";
import { AppError } from "../middleware/errorHandler";

// Service area configuration - for demo purposes hardcoded
const SERVICEABLE_PINCODES = ["203001", "201301", "201002", "201009"];

export async function getMyAddresses(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.sub },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    sendSuccess(res, addresses);
  } catch (err) {
    next(err);
  }
}

export async function createAddress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { label, line1, line2, city, state, pincode, isDefault } = req.body;

    // Validate pincode
    if (!SERVICEABLE_PINCODES.includes(pincode)) {
      throw new AppError("Service not available in this area", 400);
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user!.sub,
        label,
        line1,
        line2,
        city,
        state,
        pincode,
        isDefault: isDefault || false,
      },
    });

    sendCreated(res, address, "Address created successfully");
  } catch (err) {
    next(err);
  }
}

export async function getAddress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const address = await prisma.address.findUnique({
      where: { id: req.params.id },
    });

    if (!address || address.userId !== req.user!.sub) {
      throw new AppError("Address not found", 404);
    }

    sendSuccess(res, address);
  } catch (err) {
    next(err);
  }
}

export async function updateAddress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { label, line1, line2, city, state, pincode, isDefault } = req.body;

    const existing = await prisma.address.findUnique({
      where: { id: req.params.id },
    });

    if (!existing || existing.userId !== req.user!.sub) {
      throw new AppError("Address not found", 404);
    }

    if (pincode && !SERVICEABLE_PINCODES.includes(pincode)) {
      throw new AppError("Service not available in this area", 400);
    }

    const address = await prisma.address.update({
      where: { id: req.params.id },
      data: {
        label: label || existing.label,
        line1: line1 || existing.line1,
        line2: line2 !== undefined ? line2 : existing.line2,
        city: city || existing.city,
        state: state || existing.state,
        pincode: pincode || existing.pincode,
        isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
      },
    });

    sendSuccess(res, address, 200, "Address updated successfully");
  } catch (err) {
    next(err);
  }
}

export async function deleteAddress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const address = await prisma.address.findUnique({
      where: { id: req.params.id },
    });

    if (!address || address.userId !== req.user!.sub) {
      throw new AppError("Address not found", 404);
    }

    await prisma.address.delete({
      where: { id: req.params.id },
    });

    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

export async function validatePincode(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { pincode } = req.params;

    const isServiceable = SERVICEABLE_PINCODES.includes(pincode);

    if (!isServiceable) {
      throw new AppError("Service not available in this pincode", 400);
    }

    sendSuccess(res, { pincode, serviceable: true });
  } catch (err) {
    next(err);
  }
}
