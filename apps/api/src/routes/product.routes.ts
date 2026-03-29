import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  uuidParamSchema,
} from "../validators/product.validator";
import * as productController from "../controllers/product.controller";

const router = Router();

// Public: list & get
router.get(
  "/",
  validate(productQuerySchema, "query"),
  productController.listProducts,
);
router.get(
  "/:id",
  validate(uuidParamSchema, "params"),
  productController.getProduct,
);

// Admin-only: create, update, delete
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createProductSchema),
  productController.createProduct,
);
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(uuidParamSchema, "params"),
  validate(updateProductSchema),
  productController.updateProduct,
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(uuidParamSchema, "params"),
  productController.deleteProduct,
);

export default router;
