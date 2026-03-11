import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import * as notificationController from "../controllers/notification.controller";

const router = Router();

router.use(authenticate);

router.get("/", notificationController.getNotifications);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);
router.post("/fcm-token", notificationController.saveFcmToken);

export default router;
