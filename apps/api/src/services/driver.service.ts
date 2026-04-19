import { prisma } from "../config/prisma";
import bcrypt from "bcryptjs";
import { generatePassword } from "../utils/passwordUtils";
import type { Prisma } from "@prisma/client";

export const driverService = {
  // Admin creates a new driver with credentials
  async createDriver(data: {
    name: string;
    phone: string;
    email?: string;
    vehicleNumber?: string;
    vehicleType?: string;
    createdBy: string; // admin user ID
  }) {
    const existingDriver = await prisma.driver.findUnique({
      where: { phone: data.phone },
    });

    if (existingDriver) {
      throw new Error("Driver with this phone number already exists");
    }

    // Generate a random password
    const tempPassword = generatePassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create driver record
    const driver = await prisma.driver.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        vehicleNumber: data.vehicleNumber,
        vehicleType: data.vehicleType,
        createdBy: data.createdBy,
        passwordHash: passwordHash, // Store the hashed password
      },
      include: {
        admin: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return {
      driver,
      tempPassword, // Return to admin to give to driver
    };
  },

  // Get all drivers with filters
  async listDrivers(filters?: {
    isActive?: boolean;
    isAvailable?: boolean;
    search?: string;
    offset?: number;
    limit?: number;
  }) {
    const where: Prisma.DriverWhereInput = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        include: {
          admin: {
            select: { id: true, name: true },
          },
          orders: {
            select: { id: true, status: true },
          },
          documents: true,
        },
        skip: filters?.offset || 0,
        take: filters?.limit || 20,
        orderBy: { createdAt: "desc" },
      }),
      prisma.driver.count({ where }),
    ]);

    return {
      drivers,
      total,
      offset: filters?.offset || 0,
      limit: filters?.limit || 20,
    };
  },

  // Get single driver
  async getDriverById(id: string) {
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        admin: {
          select: { id: true, name: true, phone: true },
        },
        orders: {
          select: {
            id: true,
            status: true,
            finalAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        documents: true,
        earnings: {
          where: { status: "PENDING" },
          select: { amount: true },
        },
      },
    });

    if (!driver) {
      throw new Error("Driver not found");
    }

    // Calculate stats
    const stats = {
      totalOrders: driver.orders.length,
      totalDistance: 0, // TODO: calculate from orders
      pendingEarnings: driver.earnings.reduce((sum, e) => sum + Number(e.amount), 0),
      averageRating: driver.totalRating,
    };

    return { ...driver, stats };
  },

  // Update driver info
  async updateDriver(
    id: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      vehicleNumber?: string;
      vehicleType?: string;
      isActive?: boolean;
      isAvailable?: boolean;
    },
  ) {
    // Check if phone is being changed and conflicts
    if (data.phone) {
      const existing = await prisma.driver.findUnique({
        where: { phone: data.phone },
      });
      if (existing && existing.id !== id) {
        throw new Error("Phone number already in use");
      }
    }

    const driver = await prisma.driver.update({
      where: { id },
      data,
      include: {
        admin: {
          select: { id: true, name: true },
        },
      },
    });

    return driver;
  },

  // Reset driver password
  async resetDriverPassword(id: string) {
    const tempPassword = generatePassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const driver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      throw new Error("Driver not found");
    }

    // Update driver with new password hash
    await prisma.driver.update({
      where: { id },
      data: { passwordHash },
    });

    return {
      tempPassword,
      message: "Password reset successfully. Share this with the driver.",
    };
  },

  // Deactivate/activate driver
  async toggleDriverStatus(id: string, isActive: boolean) {
    const driver = await prisma.driver.update({
      where: { id },
      data: { isActive },
    });

    return driver;
  },

  // Toggle driver availability
  async toggleDriverAvailability(id: string, isAvailable: boolean) {
    const driver = await prisma.driver.update({
      where: { id },
      data: { isAvailable },
    });

    return driver;
  },

  // Assign order to driver
  async assignOrder(driverId: string, orderId: string) {
    const [driver, order] = await Promise.all([
      prisma.driver.findUnique({ where: { id: driverId } }),
      prisma.order.findUnique({ where: { id: orderId } }),
    ]);

    if (!driver) throw new Error("Driver not found");
    if (!order) throw new Error("Order not found");

    const assignedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { driverId },
    });

    return assignedOrder;
  },

  // Get driver earnings
  async getDriverEarnings(driverId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }) {
    const whereCondition: Prisma.EarningWhereInput = { driverId };

    if (filters?.startDate || filters?.endDate) {
      whereCondition.earnedAt = {};
      if (filters.startDate) {
        whereCondition.earnedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereCondition.earnedAt.lte = filters.endDate;
      }
    }

    if (filters?.status) {
      whereCondition.status = filters.status;
    }

    const earnings = await prisma.earning.findMany({
      where: whereCondition,
      orderBy: { earnedAt: "desc" },
    });

    const summary = {
      totalEarnings: earnings.reduce((sum, e) => sum + Number(e.amount), 0),
      pendingEarnings: earnings
        .filter((e) => e.status === "PENDING")
        .reduce((sum, e) => sum + Number(e.amount), 0),
      paidEarnings: earnings
        .filter((e) => e.status === "PAID")
        .reduce((sum, e) => sum + Number(e.amount), 0),
      count: earnings.length,
    };

    return { earnings, summary };
  },

  // Upload driver document
  async uploadDocument(driverId: string, type: string, url: string) {
    const document = await prisma.driverDocument.create({
      data: {
        driverId,
        type: type as any,
        url,
      },
    });

    return document;
  },

  // Verify driver document
  async verifyDocument(
    documentId: string,
    verified: boolean,
    rejectionReason?: string,
    verifiedBy?: string,
  ) {
    const document = await prisma.driverDocument.update({
      where: { id: documentId },
      data: {
        verified: verified ? "APPROVED" : "REJECTED",
        rejectionReason,
        verifiedAt: new Date(),
        verifiedBy,
      },
    });

    return document;
  },

  // Search drivers by phone/email for quick lookup
  async searchDriver(query: string) {
    const drivers = await prisma.driver.findMany({
      where: {
        OR: [
          { phone: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        isAvailable: true,
        totalDeliveries: true,
        totalRating: true,
      },
      take: 10,
    });

    return drivers;
  },
};
