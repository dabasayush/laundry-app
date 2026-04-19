import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface DriverRequest extends Request {
  driver?: {
    id: string;
    phone: string;
    role: string;
  };
}

export const authenticateDriver = (
  req: DriverRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.slice(7);

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;

    if (decoded.role !== "DRIVER") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Driver role required",
      });
    }

    req.driver = {
      id: decoded.id,
      phone: decoded.phone,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    const err = error as any;

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};
