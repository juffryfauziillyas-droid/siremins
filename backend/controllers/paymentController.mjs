import midtransClient from "midtrans-client";
import db from "../db.mjs";

const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-DgcmO8VcbaYbbpIzzhmORL5X"
});

// GENERATE TOKEN PEMBAYARAN MIDTRANS
export const createPaymentToken = async (req, res) => {
    try {
        const { customer_name, phone_number, dp_amount, booking_id } = req.body;

        if (!customer_name || !phone_number || !dp_amount || !booking_id) {
            return res.status(400).json({ message: "Parameter pembayaran tidak lengkap." });
        }

        let paymentAmount = Number(dp_amount);
        if (/^\d+$/.test(String(booking_id))) {
            const [bookings] = await db.query(
                "SELECT start_time, end_time, dp_amount, status FROM bookings WHERE id = ?",
                [booking_id]
            );
            if (bookings.length === 0) {
                return res.status(404).json({ message: "Data booking tidak ditemukan." });
            }

            const booking = bookings[0];
            if (booking.status !== "PENDING_DP") {
                return res.status(409).json({ message: "Booking ini tidak sedang menunggu pembayaran DP." });
            }

            if (booking.dp_amount !== null && booking.dp_amount !== undefined) {
                paymentAmount = Number(booking.dp_amount);
            } else {
                const startHour = Number(String(booking.start_time).split(":")[0]);
                let endHour = Number(String(booking.end_time).split(":")[0]);
                if (endHour === 0) endHour = 24;
                const duration = endHour - startHour;
                const packagePrices = { 1: 200000, 2: 375000, 3: 550000 };
                const totalPrice = packagePrices[duration];
                if (!totalPrice) {
                    return res.status(400).json({ message: "Durasi booking tidak valid untuk pembayaran DP." });
                }
                paymentAmount = totalPrice * 0.25;
            }
        }

        if (!Number.isInteger(paymentAmount) || paymentAmount <= 0) {
            return res.status(400).json({ message: "Nominal pembayaran tidak valid." });
        }

        const parameter = {
            transaction_details: {
                order_id: `BOOKING-${booking_id}-${Date.now()}`,
                gross_amount: paymentAmount,
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
};
