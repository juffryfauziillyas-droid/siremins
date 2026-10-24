import express from "express";
import {
    getBookingsByDate,
    createBooking,
    getMyBookings,
    updateBookingStatus,
    rescheduleBooking,
} from "../controllers/bookingController.mjs";

const router = express.Router();

router.get("/bookings", getBookingsByDate);
router.post("/bookings", createBooking);
router.get("/my-bookings", getMyBookings);
router.put("/bookings/:id/status", updateBookingStatus);
router.put("/bookings/:id/reschedule", rescheduleBooking);

export default router;

