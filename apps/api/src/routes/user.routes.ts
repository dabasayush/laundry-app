import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import * as userController from "../controllers/user.controller";

const router = Router();

// Public endpoint to check if user exists by phone (no auth required)
router.get("/by-phone", userController.getUserByPhone);

// All user routes require authentication
router.use(authenticate);

router.get("/me", userController.getMe);
router.patch("/me", userController.updateMe);

// Admin-only routes
router.get("/", authorize("ADMIN"), userController.listUsers);
router.get("/:id", authorize("ADMIN"), userController.getUserById);
router.post("/:id/block", authorize("ADMIN"), userController.blockUser);
router.post("/:id/unblock", authorize("ADMIN"), userController.unblockUser);
router.delete("/:id", authorize("ADMIN"), userController.deleteUser);

export default router;
