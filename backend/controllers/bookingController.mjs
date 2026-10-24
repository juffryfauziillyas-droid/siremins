import db from "../db.mjs";
import { confirmBookingSlot, withBookingDateLock } from "../services/bookingSlotService.mjs";

// 1. MENGAMBIL JADWAL BOOKING BERDASARKAN TANGGAL
export const getBookingsByDate = async (req, res) => {
    try {
        const { date, exclude_booking_id: excludeBookingId } = req.query;
        if (!date) {
            return res.status(400).json({ message: "Parameter tanggal diperlukan." });
        }

        // Hanya booking yang sudah membayar DP yang membuat slot tidak tersedia.
        const excludeBookingClause = excludeBookingId ? " AND id != ?" : "";
        const params = excludeBookingId ? [date, excludeBookingId] : [date];
        const [bookings] = await db.query(
            `SELECT 
                id, 
                DATE_FORMAT(booking_date, '%Y-%m-%d') as booking_date,
                DATE_FORMAT(start_time, '%H:%i') as start_time,
                DATE_FORMAT(end_time, '%H:%i') as end_time,
                status 
             FROM bookings 
             WHERE booking_date = ? AND status IN ('BOOKED', 'BOOKED_PAID')${excludeBookingClause}`,
            params
        );

        return res.json(bookings);
    } catch (error) {
        console.error("Error Get Bookings:", error);
        return res.status(500).json({ message: "Gagal mengambil data jadwal." });
    }
};

// 2. BUAT BOOKING BARU (DENGAN PENGECEKAN OVERLAP / BENTROK JAM)
export const createBooking = async (req, res) => {
    try {
        const { customer_name, phone_number, booking_date, start_time, end_time, dp_amount } = req.body;

        if (!customer_name || !phone_number || !booking_date || !start_time || !end_time) {
            return res.status(400).json({ message: "Semua data booking wajib diisi." });
        }

        // Normalisasi end_time jika tengah malam (24:00 atau 00:00)
        let normalizedEndTime = end_time;
        if (normalizedEndTime === "00:00" || normalizedEndTime === "00:00:00") {
            normalizedEndTime = "24:00:00";
        }
        let normalizedStartTime = start_time;

        // Validasi jam: pastikan start_time lebih awal dari end_time
        if (normalizedStartTime >= normalizedEndTime) {
            return res.status(400).json({ message: "Jam mulai harus lebih awal dari jam selesai." });
        }

        const startHour = Number(normalizedStartTime.split(":")[0]);
        let endHour = Number(normalizedEndTime.split(":")[0]);
        if (endHour === 0) endHour = 24;
        const duration = endHour - startHour;
        const packagePrices = { 1: 200000, 2: 375000, 3: 550000 };
        const totalPrice = packagePrices[duration];
        const parsedDpAmount = Number(dp_amount);

        if (
            !totalPrice ||
            !Number.isInteger(parsedDpAmount) ||
            parsedDpAmount < totalPrice * 0.25 ||
            parsedDpAmount > totalPrice
        ) {
            return res.status(400).json({ message: "Nominal DP tidak valid untuk durasi booking." });
        }

        const bookingResult = await withBookingDateLock(db, booking_date, async (connection) => {
            const [existing] = await connection.query(
                `SELECT id
                 FROM bookings
                 WHERE booking_date = ?
                   AND status IN ('BOOKED', 'BOOKED_PAID')
                   AND start_time < ?
                   AND end_time > ?
                 LIMIT 1`,
                [booking_date, normalizedEndTime, normalizedStartTime]
            );

            if (existing.length > 0) return null;

            const [result] = await connection.query(
                "INSERT INTO bookings (customer_name, phone_number, booking_date, start_time, end_time, dp_amount, status) VALUES (?, ?, ?, ?, ?, ?, 'PENDING_DP')",
                [customer_name, phone_number, booking_date, normalizedStartTime, normalizedEndTime, parsedDpAmount]
            );

            return result.insertId;
        });

        if (bookingResult === null) {
            return res.status(409).json({
                message: "Slot jam tersebut sudah dipesan oleh orang lain. Silakan pilih jam yang masih kosong."
            });
        }

        return res.status(201).json({
            message: "Booking berhasil dibuat. Menunggu pembayaran DP.",
            bookingId: bookingResult
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
            `SELECT bookings.*,
                    DATE_FORMAT(booking_date, '%Y-%m-%d') AS booking_date_local
             FROM bookings
             WHERE phone_number = ?
             ORDER BY booking_date ASC, start_time ASC`,
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

        if (status === "BOOKED") {
            const result = await confirmBookingSlot(db, id);
            if (result.statusCode !== 200) {
                return res.status(result.statusCode).json({ message: result.message });
            }
            return res.json({ message: result.message });
        }

        await db.query("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);
        return res.json({ message: `Status pemesanan berhasil diubah menjadi ${status}` });
    } catch (error) {
        console.error("Error Update Status:", error);
        return res.status(500).json({ message: "Gagal memperbarui status booking." });
    }
};

// 5. RESCHEDULE (GANTI JAM BOOKING DENGAN PENGECEKAN OVERLAP)
export const rescheduleBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { start_time, end_time } = req.body;

        if (!start_time || !end_time) {
            return res.status(400).json({ message: "Jam mulai dan jam selesai wajib diisi." });
        }

        // Ambil data booking yang ingin dipindahkan
        const [current] = await db.query(
            "SELECT id, DATE_FORMAT(booking_date, '%Y-%m-%d') AS booking_date FROM bookings WHERE id = ?",
            [id]
        );
        if (current.length === 0) {
            return res.status(404).json({ message: "Data booking tidak ditemukan." });
        }

        const bookingDate = current[0].booking_date;

        // Normalisasi end_time jika jam 24 / 00:00
        let normalizedEndTime = end_time;
        if (normalizedEndTime === "00:00" || normalizedEndTime === "00:00:00") {
            normalizedEndTime = "24:00:00";
        }
        let normalizedStartTime = start_time;

        // Validasi urutan jam
        if (normalizedStartTime >= normalizedEndTime) {
            return res.status(400).json({ message: "Jam mulai harus lebih awal dari jam selesai." });
        }

        const rescheduled = await withBookingDateLock(db, bookingDate, async (connection) => {
            const [conflicts] = await connection.query(
                `SELECT id
                 FROM bookings
                 WHERE booking_date = ?
                   AND id != ?
                   AND status IN ('BOOKED', 'BOOKED_PAID')
                   AND start_time < ?
                   AND end_time > ?
                 LIMIT 1`,
                [bookingDate, id, normalizedEndTime, normalizedStartTime]
            );

            if (conflicts.length > 0) return false;

            await connection.query(
                "UPDATE bookings SET start_time = ?, end_time = ? WHERE id = ?",
                [normalizedStartTime, normalizedEndTime, id]
            );

            return true;
        });

        if (!rescheduled) {
            return res.status(409).json({
                message: "Jadwal pengganti yang dipilih bertabrakan dengan pesanan lain. Silakan pilih jam lain."
            });
        }

        return res.json({ message: "Jadwal berhasil diganti!" });
    } catch (error) {
        console.error("Error Reschedule:", error);
        return res.status(500).json({ message: "Gagal mengganti jadwal di database." });
    }
};
