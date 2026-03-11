import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { db } from "../../db/client";
import { cacheGet, cacheSet, cacheDel, CacheKeys } from "../../config/redis";
import { StatusCodes } from "http-status-codes";

export const serviceRouter = Router();

// Public: list active services
serviceRouter.get("/", async (_req, res, next) => {
  try {
    const cached = await cacheGet(CacheKeys.serviceList());
    if (cached) return res.json({ success: true, data: cached });

    const services = await db("services")
      .where({ is_active: true })
      .orderBy("name");
    await cacheSet(CacheKeys.serviceList(), services, 600);
    res.json({ success: true, data: services });
  } catch (err) {
    next(err);
  }
});

serviceRouter.get("/:id", async (req, res, next) => {
  try {
    const service = await db("services").where({ id: req.params.id }).first();
    if (!service)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Service not found" });
    res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
});

// Admin: create / update / delete
serviceRouter.post(
  "/",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const [service] = await db("services").insert(req.body).returning("*");
      await cacheDel(CacheKeys.serviceList());
      res.status(StatusCodes.CREATED).json({ success: true, data: service });
    } catch (err) {
      next(err);
    }
  },
);

serviceRouter.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const [service] = await db("services")
        .where({ id: req.params.id })
        .update(req.body)
        .returning("*");
      await cacheDel(CacheKeys.serviceList());
      res.json({ success: true, data: service });
    } catch (err) {
      next(err);
    }
  },
);
