import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./db.mjs";
import midtransClient from "midtrans-client";

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "siremins_secret_key_123";

app.use(cors());
app.use(express.json());

// ==========================================
// INISIALISASI MIDTRANS (SANDBOX)
// ==========================================
let snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: "SB-Mid-server-DgcmO8VcbaYbbpIzzhmORL5X" // Menggunakan Server Key Anda
});

// ==========================================
// 1. LOGIN PENGUNJUNG (USER / CUSTOMER)
// ==========================================
app.post("/api/auth/login", async (req, res) => {
    try {
        const { phone_number, password } = req.body;

        if (!phone_number || !password) {
            return res.status(400).json({ message: "Nomor HP dan kata sandi wajib diisi." });
        }

        const [users] = await db.query(
            "SELECT * FROM users WHERE phone_number = ?",
            [phone_number],
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
});

// ==========================================
// 2. REGISTRASI PENGUNJUNG
// ==========================================
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, phone_number, password } = req.body;

        if (!name || !phone_number || !password) {
            return res.status(400).json({ message: "Semua bidang wajib diisi." });
        }

        // Cek apakah nomor HP sudah terdaftar
        const [existing] = await db.query(
            "SELECT id FROM users WHERE phone_number = ?",
            [phone_number],
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Nomor HP sudah terdaftar. Silakan masuk." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Gunakan 'CUSTOMER' sesuai ENUM database
        await db.query(
            "INSERT INTO users (name, phone_number, password, role) VALUES (?, ?, ?, 'CUSTOMER')",
            [name, phone_number, hashedPassword],
        );

        return res.json({ message: "Pendaftaran akun berhasil! Silakan masuk." });
    } catch (error) {
        console.error("Error Register User:", error);
        return res.status(500).json({ message: "Gagal mendaftar pada server." });
    }
});

// ==========================================
// 3. RESET KATA SANDI PENGUNJUNG
// ==========================================
app.post("/api/auth/reset-password", async (req, res) => {
    try {
        const { phone_number, newPassword } = req.body;

        if (!phone_number || !newPassword) {
            return res.status(400).json({ message: "Nomor HP dan kata sandi baru wajib diisi." });
        }

        const [users] = await db.query(
            "SELECT id FROM users WHERE phone_number = ?",
            [phone_number],
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
});

// ==========================================
// 4. LOGIN ADMINISTRATOR
// ==========================================
app.post("/api/auth/admin-login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email dan password wajib diisi." });
        }

        // Cari admin dengan role 'ADMIN'
        const [admins] = await db.query(
            "SELECT * FROM users WHERE email = ? AND role = 'ADMIN'",
            [email],
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
});

// ==========================================
// 5. UPDATE PROFIL PENGUNJUNG
// ==========================================
app.put("/api/auth/update-profile", async (req, res) => {
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
            [id],
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
});

// ==========================================
// 6. AMBIL RIWAYAT BOOKING PENGUNJUNG
// ==========================================
app.get("/api/my-bookings", async (req, res) => {
    try {
        const { phone_number } = req.query;

        if (!phone_number) {
            return res.status(400).json({ message: "Nomor HP wajib disertakan." });
        }

        const [bookings] = await db.query(
            "SELECT * FROM bookings WHERE phone_number = ? ORDER BY booking_date DESC, start_time DESC",
            [phone_number]
        );

        return res.json(bookings);
    } catch (error) {
        console.error("Error Get My Bookings:", error);
        return res.status(500).json({ message: "Gagal mengambil data bookingan." });
    }
});

// ==========================================
// 7. [ADMIN] AMBIL SEMUA DATA BOOKING
// ==========================================
app.get("/api/admin/bookings", async (req, res) => {
    try {
        const [bookings] = await db.query(
            "SELECT * FROM bookings ORDER BY booking_date DESC, start_time DESC"
        );
        return res.json(bookings);
    } catch (error) {
        console.error("Error Get All Bookings:", error);
        return res.status(500).json({ message: "Gagal mengambil seluruh data booking." });
    }
});

// ==========================================
// 8. [ADMIN] UBAH STATUS BOOKING
// ==========================================
app.put("/api/admin/bookings/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "Status wajib disertakan." });
        }

        await db.query("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);
        return res.json({ message: "Status booking berhasil diperbarui!" });
    } catch (error) {
        console.error("Error Update Booking Status:", error);
        return res.status(500).json({ message: "Gagal memperbarui status." });
    }
});

// ==========================================
// 9. [ADMIN] AMBIL & KELOLA DATA PENGGUNA
// ==========================================
app.get("/api/admin/users", async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, name, phone_number, email, role FROM users ORDER BY role ASC, name ASC"
        );
        return res.json(users);
    } catch (error) {
        console.error("Error Get All Users:", error);
        return res.status(500).json({ message: "Gagal mengambil data pengguna." });
    }
});

app.delete("/api/admin/users/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Cegah admin menghapus dirinya sendiri atau admin lain melalui endpoint ini
        const [checkUser] = await db.query("SELECT role FROM users WHERE id = ?", [id]);
        if (checkUser.length > 0 && checkUser[0].role === 'ADMIN') {
            return res.status(403).json({ message: "Tidak dapat menghapus akun Administrator." });
        }

        await db.query("DELETE FROM users WHERE id = ?", [id]);
        return res.json({ message: "Pengguna berhasil dihapus." });
    } catch (error) {
        console.error("Error Delete User:", error);
        return res.status(500).json({ message: "Gagal menghapus pengguna." });
    }
});

// ==========================================
// 10. MENGAMBIL JADWAL BOOKING BERDASARKAN TANGGAL
// ==========================================
app.get("/api/bookings", async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ message: "Parameter tanggal diperlukan." });
        }

        // Mengambil jadwal, HANYA yang berstatus BOOKED atau PENDING_DP
        const [bookings] = await db.query(
            `SELECT 
          id, 
          DATE_FORMAT(start_time, '%H:%i') as start_time,
          DATE_FORMAT(end_time, '%H:%i') as end_time,
          status 
         FROM bookings 
         WHERE booking_date = ? AND status != 'CANCELLED'`,
            [date]
        );

        return res.json(bookings);
    } catch (error) {
        console.error("Error Get Bookings:", error);
        return res.status(500).json({ message: "Gagal mengambil data jadwal." });
    }
});

// ==========================================
// 11. BUAT BOOKING BARU (STATUS AWAL: PENDING_DP)
// ==========================================
app.post("/api/bookings", async (req, res) => {
    try {
        const { customer_name, phone_number, booking_date, start_time, end_time } = req.body;

        const [result] = await db.query(
            "INSERT INTO bookings (customer_name, phone_number, booking_date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, 'PENDING_DP')",
            [customer_name, phone_number, booking_date, start_time, end_time]
        );

        return res.json({
            message: "Jadwal berhasil dikunci. Menunggu pembayaran.",
            bookingId: result.insertId
        });
    } catch (error) {
        console.error("Error Create Booking:", error);
        return res.status(500).json({ message: "Gagal mengunci jadwal lapangan." });
    }
});

// ==========================================
// 12. UPDATE STATUS BOOKING (BAYAR / BATAL)
// ==========================================
app.put("/api/bookings/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await db.query("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);
        return res.json({ message: `Status pemesanan berhasil diubah menjadi ${status}` });
    } catch (error) {
        console.error("Error Update Status:", error);
        return res.status(500).json({ message: "Gagal memperbarui status booking." });
    }
});

// ==========================================
// 13. GENERATE TOKEN PEMBAYARAN MIDTRANS
// ==========================================
app.post("/api/payment/token", async (req, res) => {
    try {
        const { customer_name, phone_number, dp_amount, booking_id } = req.body;

        let parameter = {
            transaction_details: {
                order_id: `BOOKING-${booking_id}-${Date.now()}`,
                gross_amount: dp_amount,
            },
            customer_details: {
                first_name: customer_name,
                phone: phone_number,
            },
            custom_expiry: {
                expiry_duration: 2,
                unit: "minute"
            }
        };

        const transaction = await snap.createTransaction(parameter);
        return res.json({ token: transaction.token });
    } catch (error) {
        console.error("Error Generating Midtrans Token:", error);
        return res.status(500).json({ message: "Gagal memproses ke payment gateway." });
    }
});

// PEMANGGILAN APP.LISTEN HARUS BERADA DI BARIS PALING BAWAH
app.listen(PORT, () => {
    console.log(`Server backend aktif di http://localhost:${PORT}`);
});