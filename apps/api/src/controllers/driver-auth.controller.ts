import type { Request, Response, NextFunction } from "express";
import { driverAuthService } from "../services/driver-auth.service";
import { handleError } from "../utils/errorHandler";

// Driver login
export const driverLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required",
      });
    }

    const { accessToken, refreshToken, driver } = await driverAuthService.driverLogin(
      phone,
      password,
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
        driver,
      },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Get driver profile
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const driverId = (req as any).driver?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const driver = await driverAuthService.getDriverProfile(driverId);

    res.json({
      success: true,
      data: driver,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Update FCM token
export const updateFcmToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const driverId = (req as any).driver?.id;
    const { fcmToken } = req.body;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      });
    }

    const driver = await driverAuthService.updateFcmToken(driverId, fcmToken);

    res.json({
      success: true,
      message: "FCM token updated",
      data: driver,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Get assigned orders
export const getAssignedOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const driverId = (req as any).driver?.id;
    const { status } = req.query;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const orders = await driverAuthService.getAssignedOrders(driverId, status as string);

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Accept/reject order
export const respondToOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const driverId = (req as any).driver?.id;
    const { orderId } = req.params;
    const { action, reason } = req.body;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!["ACCEPT", "REJECT"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be ACCEPT or REJECT",
      });
    }

    const result = await driverAuthService.respondToOrder(
      driverId,
      orderId,
      action,
      reason,
    );

    res.json({
      success: true,
      message: `Order ${action.toLowerCase()}ed successfully`,
      data: result,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Update order status
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const driverId = (req as any).driver?.id;
    const { orderId } = req.params;
    const { status } = req.body;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const order = await driverAuthService.updateOrderStatus(driverId, orderId, status);

    res.json({
      success: true,
      message: "Order status updated",
      data: order,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Complete delivery
export const completeDelivery = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const driverId = (req as any).driver?.id;
    const { orderId } = req.params;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const order = await driverAuthService.completeDelivery(driverId, orderId);

    res.json({
      success: true,
      message: "Delivery marked as complete",
      data: order,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Get driver earnings
export const getEarnings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const driverId = (req as any).driver?.id;
    const { startDate, endDate } = req.query;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await driverAuthService.getEarnings(
      driverId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};
