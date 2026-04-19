import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import * as adminController from "../controllers/admin.controller";
import {
  changePasswordSchema,
  updateAdminProfileSchema,
} from "../validators/admin.validator";

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize("ADMIN"));

// Get admin profile
router.get("/me", adminController.getMe);

// Update admin profile (name, phone)
router.patch(
  "/profile",
  validate(updateAdminProfileSchema),
  adminController.updateProfile,
);

// Change admin password
router.patch(
  "/password",
  validate(changePasswordSchema),
  adminController.changePassword,
);

export default router;
