import express from "express";
import {
    createPaymentToken,
    handleMidtransNotification,
} from "../controllers/paymentController.mjs";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.post("/token", authenticateToken, requireRole("user"), createPaymentToken);
router.post("/notification", handleMidtransNotification);

export default router;
