import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { db } from "../../db/client";

export const driverRouter = Router();

driverRouter.use(authenticate);

// Driver: get assigned orders
driverRouter.get("/my-orders", authorize("driver"), async (req, res, next) => {
  try {
    const orders = await db("orders")
      .where({ driver_id: req.user!.sub })
      .whereNotIn("status", ["delivered", "cancelled"])
      .orderBy("created_at", "desc");
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

// Admin: assign driver to order
driverRouter.patch("/assign", authorize("admin"), async (req, res, next) => {
  try {
    const { orderId, driverId } = req.body;
    await db("orders").where({ id: orderId }).update({ driver_id: driverId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
