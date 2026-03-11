import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import * as userController from "../controllers/user.controller";

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get("/me", userController.getMe);
router.patch("/me", userController.updateMe);

// Admin-only routes
router.get("/", authorize("ADMIN"), userController.listUsers);
router.get("/:id", authorize("ADMIN"), userController.getUserById);
router.delete("/:id", authorize("ADMIN"), userController.deactivateUser);

export default router;
