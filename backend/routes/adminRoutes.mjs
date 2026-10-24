import express from "express";
import {
    getAllBookings,
    updateBookingStatus,
    getAllUsers,
    deleteUser,
} from "../controllers/adminController.mjs";

const router = express.Router();

router.get("/bookings", getAllBookings);
router.put("/bookings/:id", updateBookingStatus);
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

export default router;

