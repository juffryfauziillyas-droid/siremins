import midtransClient from "midtrans-client";

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

        const parameter = {
            transaction_details: {
                order_id: `BOOKING-${booking_id}-${Date.now()}`,
                gross_amount: dp_amount,
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

