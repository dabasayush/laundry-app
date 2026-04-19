import type { Request, Response, NextFunction } from "express";
import { driverService } from "../services/driver.service";
import { handleError } from "../utils/errorHandler";

// Create a new driver (admin only)
export const createDriver = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, phone, email, vehicleNumber, vehicleType } = req.body;
    const adminId = (req as any).user?.id;

    if (!adminId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { driver, tempPassword } = await driverService.createDriver({
      name,
      phone,
      email,
      vehicleNumber,
      vehicleType,
      createdBy: adminId,
    });

    res.status(201).json({
      success: true,
      message: "Driver created successfully",
      data: {
        driver,
        tempPassword,
        note: "Share this password with the driver for their first login",
      },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// List all drivers with filters
export const listDrivers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { isActive, isAvailable, search, offset = 0, limit = 20 } = req.query;

    const result = await driverService.listDrivers({
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      isAvailable: isAvailable === "true" ? true : isAvailable === "false" ? false : undefined,
      search: search as string,
      offset: parseInt(offset as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get single driver
export const getDriver = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const driver = await driverService.getDriverById(id);

    res.json({
      success: true,
      data: driver,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update driver
export const updateDriver = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { name, phone, email, vehicleNumber, vehicleType, isActive, isAvailable } = req.body;

    const driver = await driverService.updateDriver(id, {
      name,
      phone,
      email,
      vehicleNumber,
      vehicleType,
      isActive,
      isAvailable,
    });

    res.json({
      success: true,
      message: "Driver updated successfully",
      data: driver,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// Reset driver password
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const result = await driverService.resetDriverPassword(id);

    res.json({
      success: true,
      message: result.message,
      data: {
        tempPassword: result.tempPassword,
      },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// Toggle driver active status
export const toggleActive = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const driver = await driverService.toggleDriverStatus(id, isActive);

    res.json({
      success: true,
      message: `Driver ${isActive ? "activated" : "deactivated"} successfully`,
      data: driver,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// Toggle driver availability
export const toggleAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const driver = await driverService.toggleDriverAvailability(id, isAvailable);

    res.json({
      success: true,
      message: `Driver marked as ${isAvailable ? "available" : "unavailable"}`,
      data: driver,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// Assign order to driver
export const assignOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { driverId } = req.params;
    const { orderId } = req.body;

    const order = await driverService.assignOrder(driverId, orderId);

    res.json({
      success: true,
      message: "Order assigned to driver successfully",
      data: order,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get driver earnings
export const getEarnings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, status } = req.query;

    const result = await driverService.getDriverEarnings(id, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as string,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// Search drivers
export const searchDrivers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Query parameter 'q' is required",
      });
    }

    const drivers = await driverService.searchDriver(q as string);

    res.json({
      success: true,
      data: drivers,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Upload driver document
export const uploadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { driverId } = req.params;
    const { type, url } = req.body;

    const document = await driverService.uploadDocument(driverId, type, url);

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// Verify driver document
export const verifyDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { documentId } = req.params;
    const { verified, rejectionReason } = req.body;
    const adminId = (req as any).user?.id;

    const document = await driverService.verifyDocument(
      documentId,
      verified,
      rejectionReason,
      adminId,
    );

    res.json({
      success: true,
      message: `Document ${verified ? "approved" : "rejected"} successfully`,
      data: document,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};
