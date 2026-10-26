import express from "express";
import {
    login,
    register,
    requestPasswordResetOtp,
    resetPassword,
    adminLogin,
    updateProfile,
} from "../controllers/authController.mjs";
import { authenticateToken } from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/request-password-reset-otp", requestPasswordResetOtp);
router.post("/reset-password", resetPassword);
router.post("/admin-login", adminLogin);
router.get("/me", authenticateToken, (req, res) => {
    res.json({ user: req.user });
});
router.put("/update-profile", authenticateToken, updateProfile);

export default router;
