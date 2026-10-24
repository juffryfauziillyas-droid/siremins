import express from "express";
import {
    getBookingsByDate,
    getBookingPricing,
    createBooking,
    getMyBookings,
    updateBookingStatus,
    rescheduleBooking,
} from "../controllers/bookingController.mjs";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.get("/booking-pricing", getBookingPricing);
router.get("/bookings", getBookingsByDate);
router.post("/bookings", authenticateToken, requireRole("user"), createBooking);
router.get("/my-bookings", authenticateToken, requireRole("user"), getMyBookings);
router.put("/bookings/:id/status", authenticateToken, requireRole("user"), updateBookingStatus);
router.put("/bookings/:id/reschedule", authenticateToken, requireRole("user"), rescheduleBooking);

export default router;
