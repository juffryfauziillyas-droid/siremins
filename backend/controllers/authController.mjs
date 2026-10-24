import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.mjs";

const JWT_SECRET = process.env.JWT_SECRET || "siremins_secret_key_123";

// 1. LOGIN CUSTOMER 
export const login = async (req, res) => {
    try {
        const { phone_number, password } = req.body;

        if (!phone_number || !password) {
            return res.status(400).json({ message: "Nomor HP dan kata sandi wajib diisi." });
        }

        const [users] = await db.query(
            "SELECT * FROM users WHERE phone_number = ?",
            [phone_number]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "Nomor HP atau kata sandi salah." });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Nomor HP atau kata sandi salah." });
        }

        // Normalisasi role agar kompatibel dengan frontend ('user' atau 'admin')
        const userRole = user.role === "ADMIN" ? "admin" : "user";

        const token = jwt.sign({ id: user.id, role: userRole }, JWT_SECRET, {
            expiresIn: "1d",
        });

        return res.json({
            message: "Login Pengunjung berhasil!",
            token,
            user: {
                id: user.id,
                name: user.name,
                phone_number: user.phone_number,
                email: user.email,
                role: userRole,
            },
        });
    } catch (error) {
        console.error("Error Login User:", error);
        return res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

// 2. REGISTRASI PENGUNJUNG
export const register = async (req, res) => {
    try {
        const { name, phone_number, password } = req.body;

        if (!name || !phone_number || !password) {
            return res.status(400).json({ message: "Semua bidang wajib diisi." });
        }

        // Cek apakah nomor HP sudah terdaftar
        const [existing] = await db.query(
            "SELECT id FROM users WHERE phone_number = ?",
            [phone_number]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Nomor HP sudah terdaftar. Silakan masuk." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Gunakan 'CUSTOMER' sesuai ENUM database
        await db.query(
            "INSERT INTO users (name, phone_number, password, role) VALUES (?, ?, ?, 'CUSTOMER')",
            [name, phone_number, hashedPassword]
        );

        return res.json({ message: "Pendaftaran akun berhasil! Silakan masuk." });
    } catch (error) {
        console.error("Error Register User:", error);
        return res.status(500).json({ message: "Gagal mendaftar pada server." });
    }
};

// 3. RESET KATA SANDI PENGUNJUNG
export const resetPassword = async (req, res) => {
    try {
        const { phone_number, newPassword } = req.body;

        if (!phone_number || !newPassword) {
            return res.status(400).json({ message: "Nomor HP dan kata sandi baru wajib diisi." });
        }

        const [users] = await db.query(
            "SELECT id FROM users WHERE phone_number = ?",
            [phone_number]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "Nomor HP tidak ditemukan/belum terdaftar." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query("UPDATE users SET password = ? WHERE phone_number = ?", [
            hashedPassword,
            phone_number,
        ]);

        return res.json({ message: "Kata sandi berhasil diubah! Silakan masuk." });
    } catch (error) {
        console.error("Error Reset Password:", error);
        return res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

// 4. LOGIN ADMIN
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email dan password wajib diisi." });
        }

        // Cari admin 
        const [admins] = await db.query(
            "SELECT * FROM users WHERE email = ? AND role = 'ADMIN'",
            [email]
        );

        if (admins.length === 0) {
            return res.status(400).json({ message: "Akses Admin ditolak. Email atau password salah." });
        }

        const admin = admins[0];

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Akses Admin ditolak. Email atau password salah." });
        }

        const token = jwt.sign({ id: admin.id, role: "admin" }, JWT_SECRET, {
            expiresIn: "1d",
        });

        return res.json({
            message: "Login Admin berhasil!",
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: "admin",
            },
        });
    } catch (error) {
        console.error("Error Admin Login:", error);
        return res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

// 5. UPDATE PROFIL
export const updateProfile = async (req, res) => {
    try {
        const { id, name, currentPassword, newPassword } = req.body;

        if (!id || !name) {
            return res.status(400).json({ message: "ID pengguna dan nama wajib diisi." });
        }

        const [users] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        }

        const user = users[0];

        if (newPassword && newPassword.trim() !== "") {
            if (!currentPassword) {
                return res.status(400).json({ message: "Kata sandi saat ini wajib diisi untuk mengganti kata sandi." });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Kata sandi saat ini tidak cocok/salah." });
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            await db.query("UPDATE users SET name = ?, password = ? WHERE id = ?", [
                name,
                hashedNewPassword,
                id,
            ]);
        } else {
            await db.query("UPDATE users SET name = ? WHERE id = ?", [name, id]);
        }

        const [updatedUsers] = await db.query(
            "SELECT id, name, email, phone_number, role FROM users WHERE id = ?",
            [id]
        );

        const updatedUser = updatedUsers[0];

        return res.json({
            message: "Profil berhasil diperbarui!",
            user: {
                ...updatedUser,
                role: updatedUser.role === "ADMIN" ? "admin" : "user",
            },
        });
    } catch (error) {
        console.error("Error Update Profile:", error);
        return res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

