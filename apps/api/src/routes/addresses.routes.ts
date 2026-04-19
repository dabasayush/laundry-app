import { Router } from "express"
import { authenticate } from "../middleware/authenticate"
import * as addressController from "../controllers/address.controller"

const router = Router()

// All routes require authentication
router.use(authenticate)

// Get all user addresses
router.get("/", addressController.getMyAddresses)

// Create new address
router.post("/", addressController.createAddress)

// Get single address
router.get("/:id", addressController.getAddress)

// Update address
router.patch("/:id", addressController.updateAddress)

// Delete address
router.delete("/:id", addressController.deleteAddress)

// Validate pincode (service area check)
router.get("/validate-pincode/:pincode", addressController.validatePincode)

export default router
