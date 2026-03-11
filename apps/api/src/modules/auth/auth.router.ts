import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../../middlewares/authenticate";
import * as authController from "./auth.controller";

export const authRouter = Router();

authRouter.post(
  "/register",
  [
    body("name").trim().notEmpty().isLength({ max: 100 }),
    body("email").isEmail().normalizeEmail(),
    body("phone").isMobilePhone("any"),
    body("password").isLength({ min: 8 }),
  ],
  validate,
  authController.register,
);

authRouter.post(
  "/login",
  [body("identifier").trim().notEmpty(), body("password").notEmpty()],
  validate,
  authController.login,
);

authRouter.post(
  "/refresh",
  [body("refreshToken").notEmpty()],
  validate,
  authController.refreshToken,
);

authRouter.post("/logout", authenticate, authController.logout);
