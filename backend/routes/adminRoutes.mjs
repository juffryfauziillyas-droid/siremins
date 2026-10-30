import express from "express";
import {
    getAllBookings,
    updateBookingStatus,
    getAllUsers,
    deleteUser,
    verifyManualPayment,
} from "../controllers/adminController.mjs";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.use(authenticateToken, requireRole("admin"));
router.get("/me", (req, res) => {
    res.json({ user: req.user });
});
router.get("/bookings", getAllBookings);
router.put("/bookings/:id", updateBookingStatus);
router.post("/bookings/:id/verify-manual-payment", verifyManualPayment);
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

export default router;
