import db from "../db.mjs";
import {
    BookingDateLockError,
    withBookingDateLock,
} from "../services/bookingSlotService.mjs";
import {
    BOOKING_PACKAGE_PRICES,
    getBookingPaymentSummary,
    MINIMUM_DP_RATE,
} from "../services/bookingPricing.mjs";

const databaseSchemaErrorCodes = new Set([
    "ER_BAD_FIELD_ERROR",
    "ER_NO_SUCH_TABLE",
    "ER_BAD_DB_ERROR",
    "ER_TABLE_EXISTS_ERROR",
    "ER_DUP_FIELDNAME",
    "ER_CANT_DROP_FIELD_OR_KEY",
    "ER_DUP_KEYNAME",
]);
const databaseConnectionErrorCodes = new Set([
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "EHOSTUNREACH",
    "PROTOCOL_CONNECTION_LOST",
    "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR",
    "ER_CON_COUNT_ERROR",
    "ER_SERVER_SHUTDOWN",
    "ER_CONNECTION_KILLED",
    "ER_ACCESS_DENIED_ERROR",
    "ER_DBACCESS_DENIED_ERROR",
]);
const databaseLockErrorCodes = new Set(["ER_LOCK_WAIT_TIMEOUT", "ER_LOCK_DEADLOCK"]);

const getBookingFailure = (error) => {
    if (error instanceof BookingDateLockError) {
        return {
            category: "lock",
            statusCode: 503,
            message: "Jadwal sedang diproses oleh pengguna lain. Silakan coba kembali.",
        };
    }
    if (databaseLockErrorCodes.has(error?.code)) {
        return {
            category: "lock",
            statusCode: 503,
            message: "Jadwal sedang diproses oleh pengguna lain. Silakan coba kembali.",
        };
    }
    if (databaseSchemaErrorCodes.has(error?.code)) {
        return {
            category: "schema",
            statusCode: 503,
            message: "Layanan booking belum siap. Silakan hubungi administrator.",
        };
    }
    if (databaseConnectionErrorCodes.has(error?.code)) {
        return {
            category: "connection",
            statusCode: 503,
            message: "Database booking sedang tidak dapat dihubungi. Silakan coba kembali.",
        };
    }
    return {
        category: "unexpected",
        statusCode: 500,
        message: "Booking gagal diproses karena terjadi gangguan pada server.",
    };
};

const logBookingFailure = (error, category) => {
    console.error("Booking gagal dibuat:", {
        category,
        code: error?.code || "UNKNOWN",
        errno: error?.errno,
        sqlState: error?.sqlState,
        message: error instanceof Error ? error.message : String(error),
    });
};

const rejectInvalidBooking = (res, reason, message) => {
    console.warn("Booking ditolak karena validasi:", {
        category: "validation",
        reason,
    });
    return res.status(400).json({ message });
};

const isValidDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
};

const getTimeMinutes = (value, allowEndOfDay = false) => {
    if (typeof value !== "string") return null;
    const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return null;
    const [, hourValue, minuteValue, secondValue = "00"] = match;
    const hours = Number(hourValue);
    const minutes = Number(minuteValue);
    const seconds = Number(secondValue);
    if (seconds !== 0 || minutes !== 0) return null;
    if (allowEndOfDay && hours === 24) return 24 * 60;
    if (hours < 0 || hours > 23) return null;
    return hours * 60 + minutes;
};

export const getBookingPricing = (_req, res) => {
    return res.json({
        packages: BOOKING_PACKAGE_PRICES,
        minimumDpRate: MINIMUM_DP_RATE,
    });
};

// AMBIL JADWAL BOOKING 
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

// BUAT BOOKING BARU 
export const createBooking = async (req, res) => {
    try {
        const body = req.body && typeof req.body === "object" ? req.body : {};
        const { booking_date, start_time, end_time, dp_amount } = body;

        if (!isValidDate(booking_date)) {
            return rejectInvalidBooking(res, "invalid_date", "Tanggal booking tidak valid.");
        }

        if (
            typeof start_time !== "string"
            || typeof end_time !== "string"
            || start_time.trim() === ""
            || end_time.trim() === ""
        ) {
            return rejectInvalidBooking(res, "missing_time", "Jam mulai dan jam selesai wajib diisi.");
        }

        const startMinutes = getTimeMinutes(start_time);
        const endMinutes = end_time === "00:00" || end_time === "00:00:00"
            ? 24 * 60
            : getTimeMinutes(end_time, true);
        if (
            startMinutes === null
            || endMinutes === null
            || startMinutes < 8 * 60
            || startMinutes >= 24 * 60
            || endMinutes <= startMinutes
            || endMinutes > 24 * 60
        ) {
            return rejectInvalidBooking(res, "invalid_time_range", "Rentang jam booking tidak valid.");
        }

        const normalizedStartTime = `${String(Math.floor(startMinutes / 60)).padStart(2, "0")}:00:00`;
        const normalizedEndTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:00:00`;
        const duration = (endMinutes - startMinutes) / 60;
        if (!Number.isInteger(duration)) {
            return rejectInvalidBooking(
                res,
                "non_hour_duration",
                "Jam booking harus menggunakan kelipatan satu jam."
            );
        }

        const totalPrice = BOOKING_PACKAGE_PRICES[duration];
        if (!totalPrice) {
            return rejectInvalidBooking(
                res,
                "unsupported_duration",
                "Durasi booking hanya dapat dipilih 1 sampai 3 jam."
            );
        }

        const parsedDpAmount = Number(dp_amount);

        if (
            !Number.isInteger(parsedDpAmount) ||
            parsedDpAmount < totalPrice * MINIMUM_DP_RATE ||
            parsedDpAmount > totalPrice
        ) {
            return rejectInvalidBooking(
                res,
                "invalid_dp_amount",
                "Nominal DP tidak valid untuk durasi booking."
            );
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
                "INSERT INTO bookings (user_id, customer_name, phone_number, booking_date, start_time, end_time, dp_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING_DP')",
                [req.user.id, req.user.name, req.user.phone_number, booking_date, normalizedStartTime, normalizedEndTime, parsedDpAmount]
            );

            return result.insertId;
        });

        if (bookingResult === null) {
            console.warn("Booking ditolak karena konflik jadwal:", {
                category: "conflict",
                bookingDate: booking_date,
                startTime: normalizedStartTime,
                endTime: normalizedEndTime,
            });
            return res.status(409).json({
                message: "Slot jam tersebut sudah dipesan oleh orang lain. Silakan pilih jam yang masih kosong."
            });
        }

        return res.status(201).json({
            message: "Booking berhasil dibuat. Menunggu pembayaran DP.",
            bookingId: bookingResult
        });
    } catch (error) {
        const failure = getBookingFailure(error);
        logBookingFailure(error, failure.category);
        return res.status(failure.statusCode).json({ message: failure.message });
    }
};

// RIWAYAT BOOKING CUST
export const getMyBookings = async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT bookings.*,
                    DATE_FORMAT(booking_date, '%Y-%m-%d') AS booking_date_local
             FROM bookings
             WHERE user_id = ?
             ORDER BY booking_date ASC, start_time ASC`,
            [req.user.id]
        );

        return res.json(bookings.map((booking) => ({
            ...booking,
            ...getBookingPaymentSummary(booking),
        })));
    } catch (error) {
        console.error("Error Get My Bookings:", error);
        return res.status(500).json({ message: "Gagal mengambil data bookingan." });
    }
};

// UPDATE STATUS BOOKING
export const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "Status wajib disertakan." });
        }

        if (status !== "CANCELLED") {
            return res.status(403).json({ message: "Status pembayaran hanya dapat diperbarui setelah diverifikasi server." });
        }

        const [bookings] = await db.query(
            `SELECT id, status, DATE_FORMAT(booking_date, '%Y-%m-%d') AS booking_date
             FROM bookings
             WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );
        if (bookings.length === 0) {
            return res.status(404).json({ message: "Data booking tidak ditemukan." });
        }

        const updated = await withBookingDateLock(db, bookings[0].booking_date, async (connection) => {
            await connection.beginTransaction();
            try {
                const [current] = await connection.query(
                    "SELECT status FROM bookings WHERE id = ? AND user_id = ? FOR UPDATE",
                    [id, req.user.id]
                );
                if (!current.length || !["PENDING_DP", "BOOKED"].includes(current[0].status)) {
                    await connection.rollback();
                    return false;
                }

                await connection.query(
                    "UPDATE bookings SET status = 'CANCELLED' WHERE id = ? AND user_id = ?",
                    [id, req.user.id]
                );
                await connection.commit();
                return true;
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        });
        if (!updated) {
            return res.status(409).json({ message: "Status booking tidak dapat diubah dengan cara tersebut." });
        }
        return res.json({ message: `Status pemesanan berhasil diubah menjadi ${status}` });
    } catch (error) {
        console.error("Error Update Status:", error);
        return res.status(500).json({ message: "Gagal memperbarui status booking." });
    }
};

// GANTI JAM BOOKING 
export const rescheduleBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { start_time, end_time } = req.body;

        if (!start_time || !end_time) {
            return res.status(400).json({ message: "Jam mulai dan jam selesai wajib diisi." });
        }

        // Ambil data akan dipindahkan
        const [current] = await db.query(
            `SELECT id, DATE_FORMAT(booking_date, '%Y-%m-%d') AS booking_date
             FROM bookings
            WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );
        if (current.length === 0) {
            return res.status(404).json({ message: "Data booking tidak ditemukan." });
        }

        const bookingDate = current[0].booking_date;

        // end_time jika jam 24 / 00:00
        let normalizedEndTime = end_time;
        if (normalizedEndTime === "00:00" || normalizedEndTime === "00:00:00") {
            normalizedEndTime = "24:00:00";
        }
        let normalizedStartTime = start_time;

        // urutan jam
        if (normalizedStartTime >= normalizedEndTime) {
            return res.status(400).json({ message: "Jam mulai harus lebih awal dari jam selesai." });
        }

        const rescheduleResult = await withBookingDateLock(db, bookingDate, async (connection) => {
            await connection.beginTransaction();
            try {
                const [lockedBookings] = await connection.query(
                    `SELECT status, start_time, end_time
                     FROM bookings
                     WHERE id = ? AND user_id = ?
                     FOR UPDATE`,
                    [id, req.user.id]
                );
                const lockedBooking = lockedBookings[0];
                if (!lockedBooking) {
                    await connection.rollback();
                    return "not_found";
                }

                if (!["PENDING_DP", "BOOKED", "BOOKED_PAID"].includes(lockedBooking.status)) {
                    await connection.rollback();
                    return "invalid_status";
                }

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

                if (conflicts.length > 0) {
                    await connection.rollback();
                    return "conflict";
                }

                await connection.query(
                    `UPDATE bookings
                     SET start_time = ?, end_time = ?
                     WHERE id = ? AND user_id = ? AND status = ?`,
                    [
                        normalizedStartTime,
                        normalizedEndTime,
                        id,
                        req.user.id,
                        lockedBooking.status,
                    ]
                );
                await connection.commit();
                return "updated";
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        });

        if (rescheduleResult === "not_found") {
            return res.status(404).json({ message: "Data booking tidak ditemukan." });
        }
        if (rescheduleResult === "invalid_status") {
            return res.status(409).json({ message: "Booking dengan status ini tidak dapat dijadwalkan ulang." });
        }
        if (rescheduleResult === "conflict") {
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
