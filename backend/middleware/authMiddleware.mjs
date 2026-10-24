import jwt from "jsonwebtoken";
import db from "../db.mjs";

export const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error("JWT_SECRET harus dikonfigurasi dengan minimal 32 karakter.");
    }
    return secret;
};

export const authenticateToken = async (req, res, next) => {
    const authorization = req.get("authorization");
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
        return res.status(401).json({ message: "Autentikasi diperlukan." });
    }

    let payload;
    try {
        payload = jwt.verify(match[1], getJwtSecret());
    } catch (error) {
        if (error instanceof Error && error.message.startsWith("JWT_SECRET")) {
            console.error(error.message);
            return res.status(503).json({ message: "Layanan autentikasi belum dikonfigurasi." });
        }
        return res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa." });
    }

    if (!payload || typeof payload !== "object" || !Number.isInteger(Number(payload.id))) {
        return res.status(401).json({ message: "Token tidak valid." });
    }

    try {
        const [users] = await db.query(
            "SELECT id, name, email, phone_number, role FROM users WHERE id = ?",
            [payload.id]
        );
        if (users.length === 0) {
            return res.status(401).json({ message: "Akun tidak lagi tersedia." });
        }

        const user = users[0];
        if (user.role !== "ADMIN" && user.role !== "CUSTOMER") {
            return res.status(403).json({ message: "Akun tidak memiliki akses." });
        }

        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone_number: user.phone_number,
            role: user.role === "ADMIN" ? "admin" : "user",
        };
        return next();
    } catch (error) {
        console.error("Error memverifikasi autentikasi:", error);
        return res.status(500).json({ message: "Gagal memverifikasi autentikasi." });
    }
};

export const requireRole = (...allowedRoles) => (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Anda tidak memiliki izin untuk mengakses layanan ini." });
    }
    return next();
};
