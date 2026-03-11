import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import * as paymentController from "../controllers/payment.controller";

const router = Router();

// Webhook must be before authenticate (raw body, no auth)
router.post("/webhook", paymentController.handleWebhook);

router.use(authenticate);
router.post("/intent", paymentController.createPaymentIntent);

export default router;
