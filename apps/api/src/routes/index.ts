import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import orderRoutes from "./order.routes";
import serviceRoutes from "./service.routes";
import serviceItemRoutes from "./service-item.routes";
import slotRoutes from "./slot.routes";
import paymentRoutes from "./payment.routes";
import notificationRoutes from "./notification.routes";
import analyticsRoutes from "./analytics.routes";
import offerRoutes from "./offer.routes";
import marketingRoutes from "./marketing.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/orders", orderRoutes);
router.use("/services", serviceRoutes);
router.use("/service-items", serviceItemRoutes);
router.use("/slots", slotRoutes);
router.use("/payments", paymentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/offers", offerRoutes);
router.use("/marketing", marketingRoutes);

export default router;
