import db from "../db.mjs";

export const cancelExpiredBookings = async () => {
        try {
            const pendingQuery = `
                UPDATE bookings 
                SET status = 'CANCELLED' 
                WHERE status = 'PENDING_DP'
                AND created_at <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 60 MINUTE)
            `;

            const bookedQuery = `
                UPDATE bookings
                SET status = 'CANCELLED'
                WHERE status = 'BOOKED'
                AND STR_TO_DATE(CONCAT(DATE(booking_date), ' ', start_time), '%Y-%m-%d %H:%i')
                    <= DATE_ADD(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+07:00'), INTERVAL 60 MINUTE)
            `;

            const [pendingResult] = await db.query(pendingQuery);
            const [bookedResult] = await db.query(bookedQuery);
            const affectedRows = pendingResult.affectedRows + bookedResult.affectedRows;

            if (affectedRows > 0) {
                console.log(`[Auto-Cancel] ${affectedRows} jadwal dibatalkan (${pendingResult.affectedRows} DP, ${bookedResult.affectedRows} pelunasan).`);
            }
        } catch (error) {
            console.error("Error menjalankan sistem auto-cancel:", error);
        }
};

export const startAutoCancelScheduler = () => {
    cancelExpiredBookings();
    setInterval(cancelExpiredBookings, 60000);
};
