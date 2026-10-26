import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import db from "../db.mjs";
import { sendPasswordResetOtp } from "../services/fonnteService.mjs";
import { getJwtSecret } from "../middleware/authMiddleware.mjs";

// LOGIN CUST 
export const login = async (req, res) => {
    try {
        const { phone_number, password } = req.body;

        if (!phone_number || !password) {
            return res.status(400).json({ message: "Nomor HP dan kata sandi wajib diisi." });
        }

        const [users] = await db.query(
            "SELECT * FROM users WHERE phone_number = ? AND role = 'CUSTOMER'",
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

        // penyesuaian role
        const userRole = "user";
        const token = jwt.sign({ id: user.id, role: userRole }, getJwtSecret(), {
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

// Regist cust
export const register = async (req, res) => {
    try {
        const { name, phone_number, password } = req.body;

        if (!name || !phone_number || !password) {
            return res.status(400).json({ message: "Semua bidang wajib diisi." });
        }

        // Cek nomor HP
        const [existing] = await db.query(
            "SELECT id FROM users WHERE phone_number = ?",
            [phone_number]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Nomor HP sudah terdaftar. Silakan masuk." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // agar role jadi CUSTOMER
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

// OTP RESET KATA SANDI
export const requestPasswordResetOtp = async (req, res) => {
    const genericMessage = "Jika nomor terdaftar, OTP akan dikirim melalui WhatsApp. Jika belum diterima, tunggu 1 menit sebelum mencoba lagi.";

    try {
        const phoneNumber = String(req.body.phone_number || "").trim();
        const phoneDigits = phoneNumber.replace(/\D/g, "");
        if (
            !/^[+\d\s()-]{8,24}$/.test(phoneNumber)
            || !/^(?:0|62|8)\d{7,14}$/.test(phoneDigits)
        ) {
            return res.status(400).json({ message: "Format nomor HP tidak valid." });
        }

        if (!process.env.FONNTE_TOKEN) {
            console.error("FONNTE_TOKEN belum dikonfigurasi.");
            return res.status(503).json({ message: "Layanan WhatsApp belum dikonfigurasi." });
        }

        const otpHashSecret = process.env.OTP_HASH_SECRET;
        if (!otpHashSecret || otpHashSecret.length < 32) {
            console.error("OTP_HASH_SECRET belum dikonfigurasi.");
            return res.status(503).json({ message: "Layanan OTP belum dikonfigurasi." });
        }

        const connection = await db.getConnection();
        let otp;
        let otpHash;
        let userFound = false;

        try {
            await connection.beginTransaction();

            const [users] = await connection.query(
                "SELECT id FROM users WHERE phone_number = ? AND role = 'CUSTOMER' FOR UPDATE",
                [phoneNumber]
            );

            if (users.length > 0) {
                userFound = true;
                const [previousRequests] = await connection.query(
                    `SELECT last_sent_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 60 SECOND) AS cooldown_active
                     FROM password_reset_otps
                     WHERE phone_number = ?
                     FOR UPDATE`,
                    [phoneNumber]
                );

                if (previousRequests[0]?.cooldown_active) {
                    await connection.rollback();
                    return res.json({ message: genericMessage });
                }

                otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
                otpHash = createHmac("sha256", otpHashSecret)
                    .update(`${phoneNumber}:${otp}`)
                    .digest("hex");

                await connection.query(
                    `INSERT INTO password_reset_otps
                        (phone_number, otp_hash, expires_at, attempts, last_sent_at)
                     VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE), 0, UTC_TIMESTAMP())
                     ON DUPLICATE KEY UPDATE
                        otp_hash = VALUES(otp_hash),
                        expires_at = VALUES(expires_at),
                        attempts = 0,
                        last_sent_at = VALUES(last_sent_at)`,
                    [phoneNumber, otpHash]
                );
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        if (!userFound) {
            return res.json({ message: genericMessage });
        }

        try {
            await sendPasswordResetOtp(phoneNumber, otp);
        } catch (error) {
            await db.query(
                `UPDATE password_reset_otps
                 SET otp_hash = NULL, expires_at = UTC_TIMESTAMP()
                 WHERE phone_number = ? AND otp_hash = ?`,
                [phoneNumber, otpHash]
            );
            console.error("Pengiriman OTP reset password melalui Fonnte gagal.");
            return res.status(502).json({ message: "OTP gagal dikirim. Periksa koneksi WhatsApp dan coba lagi nanti." });
        }

        return res.json({ message: genericMessage });
    } catch (error) {
        console.error("Error Request Password Reset OTP:", error);
        return res.status(500).json({ message: "Gagal memproses permintaan OTP." });
    }
};

// VERIFIKASI OTP
export const resetPassword = async (req, res) => {
    try {
        const phoneNumber = String(req.body.phone_number || "").trim();
        const otp = String(req.body.otp || "").trim();
        const { newPassword } = req.body;

        if (!phoneNumber || !/^\d{6}$/.test(otp) || typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 128) {
            return res.status(400).json({ message: "Nomor HP, OTP 6 digit, dan kata sandi baru minimal 6 karakter wajib diisi." });
        }

        const otpHashSecret = process.env.OTP_HASH_SECRET;
        if (!otpHashSecret || otpHashSecret.length < 32) {
            console.error("OTP_HASH_SECRET belum dikonfigurasi.");
            return res.status(503).json({ message: "Layanan OTP belum dikonfigurasi." });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [users] = await connection.query(
                "SELECT id FROM users WHERE phone_number = ? AND role = 'CUSTOMER' FOR UPDATE",
                [phoneNumber]
            );
            if (users.length === 0) {
                await connection.rollback();
                return res.status(400).json({ message: "OTP tidak valid atau sudah kedaluwarsa." });
            }

            const [challenges] = await connection.query(
                `SELECT otp_hash, expires_at > UTC_TIMESTAMP() AS not_expired, attempts
                 FROM password_reset_otps
                 WHERE phone_number = ?
                 FOR UPDATE`,
                [phoneNumber]
            );
            const challenge = challenges[0];
            if (!challenge?.otp_hash || !challenge.not_expired || challenge.attempts >= 5) {
                await connection.rollback();
                return res.status(400).json({ message: "OTP tidak valid atau sudah kedaluwarsa." });
            }

            const submittedHash = createHmac("sha256", otpHashSecret)
                .update(`${phoneNumber}:${otp}`)
                .digest("hex");
            const storedHash = Buffer.from(challenge.otp_hash, "hex");
            const submittedHashBuffer = Buffer.from(submittedHash, "hex");
            const isOtpValid = storedHash.length === submittedHashBuffer.length
                && timingSafeEqual(storedHash, submittedHashBuffer);

            if (!isOtpValid) {
                await connection.query(
                    "UPDATE password_reset_otps SET attempts = attempts + 1 WHERE phone_number = ?",
                    [phoneNumber]
                );
                await connection.commit();
                return res.status(400).json({ message: "OTP tidak valid atau sudah kedaluwarsa." });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await connection.query("UPDATE users SET password = ? WHERE id = ?", [
                hashedPassword,
                users[0].id,
            ]);
            await connection.query(
                `UPDATE password_reset_otps
                 SET otp_hash = NULL, expires_at = UTC_TIMESTAMP(), attempts = 5
                 WHERE phone_number = ?`,
                [phoneNumber]
            );

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        return res.json({ message: "Kata sandi berhasil diubah! Silakan masuk." });
    } catch (error) {
        console.error("Error Reset Password:", error);
        return res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

// LOGIN ADMIN
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

        const token = jwt.sign({ id: admin.id, role: "admin" }, getJwtSecret(), {
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

// UPDATE PROFIL
export const updateProfile = async (req, res) => {
    try {
        const { name, currentPassword, newPassword } = req.body;
        const id = req.user.id;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ message: "Nama wajib diisi." });
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
                name.trim(),
                hashedNewPassword,
                id,
            ]);
        } else {
            await db.query("UPDATE users SET name = ? WHERE id = ?", [name.trim(), id]);
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
