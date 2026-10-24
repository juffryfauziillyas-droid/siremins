export class BookingDateLockError extends Error {
    constructor(bookingDate) {
        super(`Gagal mendapatkan lock jadwal untuk tanggal ${bookingDate}.`);
        this.name = "BookingDateLockError";
        this.code = "BOOKING_DATE_LOCK_TIMEOUT";
    }
}

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
            throw new BookingDateLockError(bookingDate);
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
