export const withBookingDateLock = async (db, bookingDate, operation) => {
    const connection = await db.getConnection();
    const lockName = `siremins-booking-${bookingDate}`;
    let lockAcquired = false;

    try {
        const [lockResult] = await connection.query(
            "SELECT GET_LOCK(?, 10) AS acquired",
            [lockName]
        );

        if (Number(lockResult[0].acquired) !== 1) {
            throw new Error(`Gagal mendapatkan lock jadwal untuk tanggal ${bookingDate}.`);
        }
        lockAcquired = true;

        return await operation(connection);
    } finally {
        try {
            if (lockAcquired) {
                await connection.query("SELECT RELEASE_LOCK(?)", [lockName]);
            }
        } finally {
            connection.release();
        }
    }
};

export const confirmBookingSlot = async (db, bookingId) => {
    const connection = await db.getConnection();
    let lockName;
    let lockAcquired = false;

    try {
        const [bookings] = await connection.query(
            `SELECT id, DATE_FORMAT(booking_date, '%Y-%m-%d') AS booking_date,
                    start_time, end_time, status
             FROM bookings
             WHERE id = ?`,
            [bookingId]
        );

        if (bookings.length === 0) {
            return { statusCode: 404, message: "Data booking tidak ditemukan." };
        }

        const booking = bookings[0];
        lockName = `siremins-booking-${booking.booking_date}`;
        const [lockResult] = await connection.query(
            "SELECT GET_LOCK(?, 10) AS acquired",
            [lockName]
        );

        if (Number(lockResult[0].acquired) !== 1) {
            throw new Error(`Gagal mendapatkan lock jadwal untuk tanggal ${booking.booking_date}.`);
        }
        lockAcquired = true;

        const [currentBookings] = await connection.query(
            `SELECT id, DATE_FORMAT(booking_date, '%Y-%m-%d') AS booking_date,
                    start_time, end_time, status
             FROM bookings
             WHERE id = ?
             FOR UPDATE`,
            [bookingId]
        );

        if (currentBookings.length === 0) {
            return { statusCode: 404, message: "Data booking tidak ditemukan." };
        }

        const currentBooking = currentBookings[0];
        if (currentBooking.status === "CANCELLED" || currentBooking.status === "REJECTED") {
            return {
                statusCode: 409,
                message: "Booking sudah dibatalkan dan tidak dapat dikonfirmasi."
            };
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
            [currentBooking.booking_date, bookingId, currentBooking.end_time, currentBooking.start_time]
        );

        if (conflicts.length > 0) {
            await connection.query(
                "UPDATE bookings SET status = 'CANCELLED' WHERE id = ? AND status = 'PENDING_DP'",
                [bookingId]
            );
            return {
                statusCode: 409,
                message: "Jadwal sudah dibayar oleh pengguna lain. Booking ini dibatalkan. Jika pembayaran Anda sudah terpotong, hubungi admin."
            };
        }

        if (currentBooking.status !== "PENDING_DP" && currentBooking.status !== "BOOKED" && currentBooking.status !== "BOOKED_PAID") {
            return { statusCode: 409, message: "Status booking tidak dapat dikonfirmasi." };
        }

        const [updated] = await connection.query(
            "UPDATE bookings SET status = 'BOOKED' WHERE id = ? AND status = 'PENDING_DP'",
            [bookingId]
        );

        await connection.query(
            `UPDATE bookings
             SET status = 'CANCELLED'
             WHERE booking_date = ?
               AND id != ?
               AND status = 'PENDING_DP'
               AND start_time < ?
               AND end_time > ?`,
            [currentBooking.booking_date, bookingId, currentBooking.end_time, currentBooking.start_time]
        );

        if (updated.affectedRows === 0 && currentBooking.status === "PENDING_DP") {
            return { statusCode: 409, message: "Status booking berubah. Silakan muat ulang data." };
        }

        return { statusCode: 200, message: "Pembayaran berhasil. Jadwal telah dikonfirmasi." };
    } finally {
        try {
            if (lockAcquired) {
                await connection.query("SELECT RELEASE_LOCK(?)", [lockName]);
            }
        } finally {
            connection.release();
        }
    }
};
