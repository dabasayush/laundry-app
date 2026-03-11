import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { db } from "../../db/client";

export const notificationRouter = Router();

notificationRouter.use(authenticate);

// List notifications for authenticated user
notificationRouter.get("/", async (req, res, next) => {
  try {
    const notifications = await db("notifications")
      .where({ user_id: req.user!.sub })
      .orderBy("created_at", "desc")
      .limit(50);
    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
});

// Mark notification as read
notificationRouter.patch("/:id/read", async (req, res, next) => {
  try {
    await db("notifications")
      .where({ id: req.params.id, user_id: req.user!.sub })
      .update({ is_read: true });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Mark all as read
notificationRouter.patch("/read-all", async (req, res, next) => {
  try {
    await db("notifications")
      .where({ user_id: req.user!.sub })
      .update({ is_read: true });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Save / update FCM token
notificationRouter.post("/fcm-token", async (req, res, next) => {
  try {
    const { token } = req.body;
    await db("users").where({ id: req.user!.sub }).update({ fcm_token: token });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
