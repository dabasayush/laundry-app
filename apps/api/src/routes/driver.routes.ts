import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import * as driverController from "../controllers/driver.controller";

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize("ADMIN"));

// Driver CRUD
router.post("/", driverController.createDriver);
router.get("/", driverController.listDrivers);
router.get("/search", driverController.searchDrivers);
router.get("/:id", driverController.getDriver);
router.patch("/:id", driverController.updateDriver);

// Driver actions
router.post("/:id/reset-password", driverController.resetPassword);
router.post("/:id/toggle-active", driverController.toggleActive);
router.post("/:id/toggle-availability", driverController.toggleAvailability);
router.post("/:id/assign-order", driverController.assignOrder);

// Driver earnings
router.get("/:id/earnings", driverController.getEarnings);

// Driver documents
router.post("/:driverId/documents", driverController.uploadDocument);
router.post("/documents/:documentId/verify", driverController.verifyDocument);

export default router;
