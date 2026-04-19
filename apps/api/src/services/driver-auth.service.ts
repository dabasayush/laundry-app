import { prisma } from "../config/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Prisma } from "@prisma/client";

export const driverAuthService = {
  // Driver login with phone and password
  async driverLogin(phone: string, password: string) {
    // Find driver by phone
    const driver = await prisma.driver.findUnique({
      where: { phone },
    });

    if (!driver) {
      throw new Error("Invalid phone or password");
    }

    if (!driver.isActive) {
      throw new Error("Driver account is inactive");
    }

    // Verify password
    if (!driver.passwordHash) {
      throw new Error("Driver credentials not set. Please contact administrator.");
    }

    const isPasswordValid = await bcrypt.compare(password, driver.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Invalid phone or password");
    }

    const accessToken = jwt.sign(
      {
        id: driver.id,
        phone: driver.phone,
        role: "DRIVER",
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      {
        id: driver.id,
        phone: driver.phone,
        role: "DRIVER",
      },
      env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    // Update last login
    await prisma.driver.update({
      where: { id: driver.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      driver: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        isAvailable: driver.isAvailable,
        totalDeliveries: driver.totalDeliveries,
        totalRating: driver.totalRating,
      },
    };
  },

  // Get driver profile
  async getDriverProfile(driverId: string) {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        documents: {
          select: {
            id: true,
            type: true,
            verified: true,
            url: true,
          },
        },
        orders: {
          select: {
            id: true,
            status: true,
            finalAmount: true,
            createdAt: true,
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!driver) {
      throw new Error("Driver not found");
    }

    return {
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      vehicleNumber: driver.vehicleNumber,
      vehicleType: driver.vehicleType,
      isAvailable: driver.isAvailable,
      totalDeliveries: driver.totalDeliveries,
      totalRating: driver.totalRating,
      fcmToken: driver.fcmToken,
      createdAt: driver.createdAt,
      documents: driver.documents,
      recentOrders: driver.orders,
    };
  },

  // Update driver FCM token
  async updateFcmToken(driverId: string, fcmToken: string) {
    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { fcmToken },
    });

    return driver;
  },

  // Get assigned orders for driver
  async getAssignedOrders(driverId: string, status?: string) {
    const where: any = { driverId };

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        address: true,
        items: {
          include: {
            serviceItem: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders;
  },

  // Accept/reject order
  async respondToOrder(
    driverId: string,
    orderId: string,
    action: "ACCEPT" | "REJECT",
    reason?: string,
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.driverId !== driverId) {
      throw new Error("Order not assigned to this driver");
    }

    // Record the action
    await prisma.driverOrderAction.create({
      data: {
        orderId,
        driverId,
        action,
        reason,
      },
    });

    if (action === "REJECT") {
      // Unassign the order
      await prisma.order.update({
        where: { id: orderId },
        data: { driverId: null, status: "PENDING" },
      });
    } else if (action === "ACCEPT") {
      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PICKUP_ASSIGNED" },
      });
    }

    return { success: true, action };
  },

  // Update order status
  async updateOrderStatus(driverId: string, orderId: string, status: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.driverId !== driverId) {
      throw new Error("Order not assigned to this driver");
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as any,
        updatedAt: new Date(),
      },
    });

    return updated;
  },

  // Record delivery completion
  async completeDelivery(driverId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.driverId !== driverId) {
      throw new Error("Order not assigned to this driver");
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "DELIVERED" as any,
        paymentStatus: "PAID" as any,
        updatedAt: new Date(),
      },
    });

    // Record earning
    await prisma.earning.create({
      data: {
        driverId,
        orderId,
        amount: new Prisma.Decimal(order.finalAmount), // commission percentage would be applied here
        earnedAt: new Date(),
        type: "DELIVERY",
        status: "PENDING",
      },
    });

    // Update driver stats
    await prisma.driver.update({
      where: { id: driverId },
      data: { totalDeliveries: { increment: 1 } },
    });

    return updated;
  },

  // Get driver earnings
  async getEarnings(driverId: string, startDate?: Date, endDate?: Date) {
    const where: any = { driverId };

    if (startDate || endDate) {
      where.earnedAt = {};
      if (startDate) where.earnedAt.gte = startDate;
      if (endDate) where.earnedAt.lte = endDate;
    }

    const earnings = await prisma.earning.findMany({
      where,
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

    // Group by date for chart
    const byDate: Record<string, number> = {};
    earnings.forEach((e) => {
      const date = e.earnedAt.toISOString().split("T")[0];
      byDate[date] = (byDate[date] || 0) + Number(e.amount);
    });

    return {
      earnings,
      summary,
      byDate,
    };
  },
};
