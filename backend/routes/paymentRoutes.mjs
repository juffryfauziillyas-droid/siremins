import express from "express";
import { createPaymentToken } from "../controllers/paymentController.mjs";

const router = express.Router();

router.post("/token", createPaymentToken);

export default router;

