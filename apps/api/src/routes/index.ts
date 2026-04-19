import { Router } from "express"
import authRoutes from "./auth.routes"
import adminRoutes from "./admin.routes"
import userRoutes from "./user.routes"
import addressRoutes from "./addresses.routes"
import orderRoutes from "./order.routes"
import serviceRoutes from "./service.routes"
import serviceItemRoutes from "./service-item.routes"
import slotRoutes from "./slot.routes"
import paymentRoutes from "./payment.routes"
import notificationRoutes from "./notification.routes"
import analyticsRoutes from "./analytics.routes"
import offerRoutes from "./offer.routes"
import marketingRoutes from "./marketing.routes"
import productRoutes from "./product.routes"
import itemRoutes from "./item.routes"
import bannerRoutes from "./banner.routes"
import driverRoutes from "./driver.routes"
import driverAppRoutes from "./driver-app.routes"

const router = Router()

router.use("/auth", authRoutes)
router.use("/admin", adminRoutes)
router.use("/users", userRoutes)
router.use("/addresses", addressRoutes)
router.use("/drivers", driverRoutes)
router.use("/driver-app", driverAppRoutes)
router.use("/orders", orderRoutes)
router.use("/services", serviceRoutes)
router.use("/service-items", serviceItemRoutes)
router.use("/items", itemRoutes)
router.use("/slots", slotRoutes)
router.use("/payments", paymentRoutes)
router.use("/notifications", notificationRoutes)
router.use("/analytics", analyticsRoutes)
router.use("/offers", offerRoutes)
router.use("/marketing", marketingRoutes)
router.use("/products", productRoutes)
router.use("/banners", bannerRoutes)

export default router
