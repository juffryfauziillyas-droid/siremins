import express from "express";
import {
    getAllBookings,
    updateBookingStatus,
    getAllUsers,
    deleteUser,
} from "../controllers/adminController.mjs";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.use(authenticateToken, requireRole("admin"));
router.get("/bookings", getAllBookings);
router.put("/bookings/:id", updateBookingStatus);
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

export default router;
