import db from "../db.mjs";
import { withBookingDateLock } from "../services/bookingSlotService.mjs";
// ADMIN AMBIL DATA BOOKING
export const getAllBookings = async (req, res) => {
    try {
        const { date } = req.query;
        const query = date
            ? "SELECT * FROM bookings WHERE booking_date = ? ORDER BY start_time ASC"
            : "SELECT * FROM bookings ORDER BY booking_date DESC, start_time DESC";
        const [bookings] = await db.query(query, date ? [date] : []);
        return res.json(bookings);
    } catch (error) {
        console.error("Error Get All Bookings:", error);
        return res.status(500).json({ message: "Gagal mengambil seluruh data" });
    }
};

// ADMIN UBAH STATUS BOOKING
export const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["REJECTED", "CANCELLED"].includes(status)) {
            return res.status(400).json({ message: "Admin hanya dapat menolak atau membatalkan booking." });
        }

        const [bookings] = await db.query(
            `SELECT DATE_FORMAT(booking_date, '%Y-%m-%d') AS booking_date
             FROM bookings
             WHERE id = ?`,
            [id]
        );
        if (bookings.length === 0) {
            return res.status(409).json({ message: "Booking tidak ditemukan atau statusnya tidak dapat diubah." });
        }
        const updated = await withBookingDateLock(db, bookings[0].booking_date, async (connection) => {
            await connection.beginTransaction();
            try {
                const [current] = await connection.query(
                    "SELECT status FROM bookings WHERE id = ? FOR UPDATE",
                    [id]
                );
                if (!current.length || !["PENDING_DP", "BOOKED"].includes(current[0].status)) {
                    await connection.rollback();
                    return false;
                }
                await connection.query(
                    "UPDATE bookings SET status = ? WHERE id = ?",
                    [status, id]
                );
                await connection.commit();
                return true;
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        });
        if (!updated) {
            return res.status(409).json({ message: "Booking tidak ditemukan atau statusnya tidak dapat diubah." });
        }
        return res.json({ message: "Status booking berhasil diperbarui!" });
    } catch (error) {
        console.error("Error Update Booking Status:", error);
        return res.status(500).json({ message: "Gagal memperbarui status." });
    }
};

// ADMIN AMBIL DATA SEMUA PENGGUNA
export const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, name, phone_number, email, role FROM users WHERE role = 'CUSTOMER' ORDER BY id ASC"
        );
        return res.json(users);
    } catch (error) {
        console.error("Error Get All Users:", error);
        return res.status(500).json({ message: "Gagal mengambil data pengguna." });
    }
};

// ADMIN HAPUS PENGGUNA 
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // agar akun Administrator tidak terhapus
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
};
