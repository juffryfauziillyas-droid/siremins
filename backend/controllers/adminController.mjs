import db from "../db.mjs";
import { confirmBookingSlot } from "../services/bookingSlotService.mjs";

// 1. [ADMIN] AMBIL SEMUA DATA BOOKING
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
        return res.status(500).json({ message: "Gagal mengambil seluruh data booking." });
    }
};

// 2. [ADMIN] UBAH STATUS BOOKING
export const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "Status wajib disertakan." });
        }

        if (status === "BOOKED") {
            const result = await confirmBookingSlot(db, id);
            if (result.statusCode !== 200) {
                return res.status(result.statusCode).json({ message: result.message });
            }
            return res.json({ message: result.message });
        }

        await db.query("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);
        return res.json({ message: "Status booking berhasil diperbarui!" });
    } catch (error) {
        console.error("Error Update Booking Status:", error);
        return res.status(500).json({ message: "Gagal memperbarui status." });
    }
};

// 3. [ADMIN] AMBIL DATA SEMUA PENGGUNA
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

// 4. [ADMIN] HAPUS PENGGUNA (BUKAN ADMIN)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Cegah admin menghapus akun Administrator
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
