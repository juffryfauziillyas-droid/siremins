import db from "../db.mjs";

// 1. MENGAMBIL JADWAL BOOKING BERDASARKAN TANGGAL
export const getBookingsByDate = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ message: "Parameter tanggal diperlukan." });
        }

        // Mengambil jadwal yang aktif (tidak dibatalkan atau ditolak)
        const [bookings] = await db.query(
            `SELECT 
                id, 
                DATE_FORMAT(start_time, '%H:%i') as start_time,
                DATE_FORMAT(end_time, '%H:%i') as end_time,
                status 
             FROM bookings 
             WHERE booking_date = ? AND status NOT IN ('CANCELLED', 'REJECTED')`,
            [date]
        );

        return res.json(bookings);
    } catch (error) {
        console.error("Error Get Bookings:", error);
        return res.status(500).json({ message: "Gagal mengambil data jadwal." });
    }
};

// 2. BUAT BOOKING BARU (STATUS AWAL: PENDING_DP)
export const createBooking = async (req, res) => {
    try {
        const { customer_name, phone_number, booking_date, start_time, end_time } = req.body;

        if (!customer_name || !phone_number || !booking_date || !start_time || !end_time) {
            return res.status(400).json({ message: "Semua data booking wajib diisi." });
        }

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
};

// 3. AMBIL RIWAYAT BOOKING PENGUNJUNG
export const getMyBookings = async (req, res) => {
    try {
        const { phone_number } = req.query;

        if (!phone_number) {
            return res.status(400).json({ message: "Nomor HP wajib disertakan." });
        }

        const [bookings] = await db.query(
            "SELECT * FROM bookings WHERE phone_number = ? ORDER BY booking_date ASC, start_time ASC",
            [phone_number]
        );

        return res.json(bookings);
    } catch (error) {
        console.error("Error Get My Bookings:", error);
        return res.status(500).json({ message: "Gagal mengambil data bookingan." });
    }
};

// 4. UPDATE STATUS BOOKING (BAYAR / BATAL DARI SISI USER ATAU SNAP)
export const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "Status wajib disertakan." });
        }

        await db.query("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);
        return res.json({ message: `Status pemesanan berhasil diubah menjadi ${status}` });
    } catch (error) {
        console.error("Error Update Status:", error);
        return res.status(500).json({ message: "Gagal memperbarui status booking." });
    }
};

// 5. RESCHEDULE (GANTI JAM BOOKING)
export const rescheduleBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { start_time, end_time } = req.body;

        if (!start_time || !end_time) {
            return res.status(400).json({ message: "Jam mulai dan jam selesai wajib diisi." });
        }

        await db.query(
            "UPDATE bookings SET start_time = ?, end_time = ? WHERE id = ?",
            [start_time, end_time, id]
        );
        return res.json({ message: "Jadwal berhasil diganti!" });
    } catch (error) {
        console.error("Error Reschedule:", error);
        return res.status(500).json({ message: "Gagal mengganti jadwal di database." });
    }
};

