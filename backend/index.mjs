import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.mjs";
import bookingRoutes from "./routes/bookingRoutes.mjs";
import paymentRoutes from "./routes/paymentRoutes.mjs";
import adminRoutes from "./routes/adminRoutes.mjs";
import { getJwtSecret } from "./middleware/authMiddleware.mjs";
import { startAutoCancelScheduler } from "./services/autoCancelService.mjs";

dotenv.config();
getJwtSecret();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares Global
app.use(cors());
app.use(express.json());

// DAFTAR ROUTES (API ENDPOINTS)
app.use("/api/auth", authRoutes);
app.use("/api", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);

// Endpoint Health Check
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "SIREMINS API is running smoothly." });
});

// BACKGROUND SERVICES / SCHEDULER
startAutoCancelScheduler();

// LISTENER SERVER
app.listen(PORT, () => {
    console.log(`Server backend aktif di http://localhost:${PORT}`);
});
