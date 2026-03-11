import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { db } from "../../db/client";
import { cacheGet, cacheSet, cacheDel, CacheKeys } from "../../config/redis";
import { AppError } from "../../middlewares/errorHandler";
import { StatusCodes } from "http-status-codes";

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get("/me", async (req, res, next) => {
  try {
    const cached = await cacheGet(CacheKeys.user(req.user!.sub));
    if (cached) return res.json({ success: true, data: cached });

    const user = await db("users")
      .where({ id: req.user!.sub })
      .select(
        "id",
        "name",
        "email",
        "phone",
        "role",
        "address",
        "is_verified",
        "created_at",
      )
      .first();

    if (!user) throw new AppError("User not found", StatusCodes.NOT_FOUND);
    await cacheSet(CacheKeys.user(req.user!.sub), user, 900);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

userRouter.patch("/me", async (req, res, next) => {
  try {
    const allowed = ["name", "phone", "address"];
    const update = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k)),
    );

    const [user] = await db("users")
      .where({ id: req.user!.sub })
      .update({ ...update, updated_at: db.fn.now() })
      .returning("id", "name", "email", "phone", "role", "address");

    await cacheDel(CacheKeys.user(req.user!.sub));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// Admin: list all users
userRouter.get("/", authorize("admin"), async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const role = req.query.role as string | undefined;

    const query = db("users").select(
      "id",
      "name",
      "email",
      "phone",
      "role",
      "is_active",
      "created_at",
    );
    if (role) query.where({ role });

    const users = await query
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset((page - 1) * limit);
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});
