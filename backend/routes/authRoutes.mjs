import express from "express";
import {
    login,
    register,
    requestPasswordResetOtp,
    resetPassword,
    adminLogin,
    updateProfile,
} from "../controllers/authController.mjs";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/request-password-reset-otp", requestPasswordResetOtp);
router.post("/reset-password", resetPassword);
router.post("/admin-login", adminLogin);
router.put("/update-profile", updateProfile);

export default router;
