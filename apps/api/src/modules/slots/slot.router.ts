import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { db } from "../../db/client";
import { cacheGet, cacheSet, CacheKeys } from "../../config/redis";

export const slotRouter = Router();

// Public: check slot availability for a date
slotRouter.get("/availability", async (req, res, next) => {
  try {
    const date = req.query.date as string;
    if (!date)
      return res
        .status(400)
        .json({ success: false, message: "date query param required" });

    const cached = await cacheGet(CacheKeys.slotAvailability(date));
    if (cached) return res.json({ success: true, data: cached });

    const slots = await db("slots")
      .where({ date, is_active: true })
      .whereRaw("booked_count < capacity")
      .orderBy("start_time")
      .select(
        "id",
        "date",
        "start_time",
        "end_time",
        "capacity",
        "booked_count",
      );

    await cacheSet(CacheKeys.slotAvailability(date), slots, 60); // 1 min TTL — high-demand data
    res.json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
});

// Admin: create slots
slotRouter.post(
  "/",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const [slot] = await db("slots").insert(req.body).returning("*");
      res.status(201).json({ success: true, data: slot });
    } catch (err) {
      next(err);
    }
  },
);
