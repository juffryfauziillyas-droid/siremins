import db from "../db.mjs";

// ==========================================
// AUTO-CANCEL JADWAL (5 MENIT SEBELUM MAIN JIKA BELUM LUNAS)
// ==========================================
// Sistem akan mengecek database setiap 1 menit (60.000 milidetik)
export const startAutoCancelScheduler = () => {
    setInterval(async () => {
        try {
            // Menggabungkan tanggal dan jam main, lalu membandingkannya dengan Waktu Saat Ini + 5 menit
            const query = `
                UPDATE bookings 
                SET status = 'CANCELLED' 
                WHERE status IN ('PENDING_DP', 'BOOKED') 
                AND STR_TO_DATE(CONCAT(DATE(booking_date), ' ', start_time), '%Y-%m-%d %H:%i') <= DATE_ADD(NOW(), INTERVAL 5 MINUTE)
            `;

            const [result] = await db.query(query);

            if (result.affectedRows > 0) {
                console.log(`[Auto-Cancel] ${result.affectedRows} jadwal dibatalkan karena melewati batas pelunasan (5 menit sebelum main).`);
            }
        } catch (error) {
            console.error("Error menjalankan sistem auto-cancel:", error);
        }
    }, 60000);
};

