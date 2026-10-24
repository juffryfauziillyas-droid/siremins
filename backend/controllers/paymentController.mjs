import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import midtransClient from "midtrans-client";
import db from "../db.mjs";
import { withBookingDateLock } from "../services/bookingSlotService.mjs";
import { getBookingTotal, MINIMUM_DP_RATE } from "../services/bookingPricing.mjs";

const verifyNotificationSignature = (notification, serverKey) => {
    if (!notification || typeof notification !== "object" || Array.isArray(notification)) {
        return false;
    }
    const { order_id: orderId, status_code: statusCode, gross_amount: grossAmount, signature_key: signature } = notification;
    if (
        typeof orderId !== "string"
        || typeof statusCode !== "string"
        || typeof grossAmount !== "string"
        || typeof signature !== "string"
        || !/^\d+(?:\.00)?$/.test(grossAmount)
        || !/^[a-f\d]{128}$/i.test(signature)
    ) {
        return false;
    }

    const expectedSignature = createHash("sha512")
        .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
        .digest();
    const receivedSignature = Buffer.from(signature, "hex");
    return receivedSignature.length === expectedSignature.length
        && timingSafeEqual(receivedSignature, expectedSignature);
};

const getNotificationResult = (notification) => {
    if (notification.transaction_status === "settlement") return "SETTLEMENT";
    if (
        notification.transaction_status === "capture"
        && notification.fraud_status === "accept"
    ) {
        return "CAPTURE";
    }
    if (["pending", "deny", "cancel", "expire"].includes(notification.transaction_status)) {
        return notification.transaction_status.toUpperCase();
    }
    if (notification.transaction_status === "capture") return "CHALLENGE";
    return null;
};

export const createPaymentToken = async (req, res) => {
    let orderId;
    try {
        const { booking_id: bookingReference } = req.body;
        if (bookingReference === undefined || bookingReference === null) {
            return res.status(400).json({ message: "ID booking wajib disertakan." });
        }

        const match = String(bookingReference).match(/^(?:LUNAS-)?([1-9]\d*)$/);
        if (!match) {
            return res.status(400).json({ message: "ID booking tidak valid." });
        }

        const bookingId = Number(match[1]);
        const isSettlement = String(bookingReference).startsWith("LUNAS-");
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        if (!serverKey) {
            console.error("MIDTRANS_SERVER_KEY belum dikonfigurasi.");
            return res.status(503).json({ message: "Layanan pembayaran belum dikonfigurasi." });
        }

        const [bookings] = await db.query(
            `SELECT id, customer_name, phone_number, start_time, end_time, dp_amount, status
             FROM bookings
             WHERE id = ? AND user_id = ?`,
            [bookingId, req.user.id]
        );
        if (bookings.length === 0) {
            return res.status(404).json({ message: "Data booking tidak ditemukan." });
        }

        const booking = bookings[0];
        const expectedStatus = isSettlement ? "BOOKED" : "PENDING_DP";
        if (booking.status !== expectedStatus) {
            return res.status(409).json({
                message: isSettlement
                    ? "Booking ini tidak dapat menerima pelunasan."
                    : "Booking ini tidak sedang menunggu pembayaran DP.",
            });
        }

        const totalPrice = getBookingTotal(booking);
        const dpAmount = booking.dp_amount === null || booking.dp_amount === undefined
            ? totalPrice * MINIMUM_DP_RATE
            : Number(booking.dp_amount);
        const paymentAmount = isSettlement ? totalPrice - dpAmount : dpAmount;
        if (
            !Number.isInteger(totalPrice)
            || !Number.isInteger(dpAmount)
            || dpAmount < totalPrice * MINIMUM_DP_RATE
            || dpAmount > totalPrice
            || !Number.isInteger(paymentAmount)
            || paymentAmount <= 0
        ) {
            return res.status(400).json({ message: "Nominal pembayaran tidak valid." });
        }

        orderId = `SIREMINS-${booking.id}-${randomBytes(12).toString("hex")}`;
        await db.query(
            `INSERT INTO midtrans_payment_transactions
                (order_id, booking_id, payment_type, gross_amount, transaction_status)
             VALUES (?, ?, ?, ?, 'CREATED')`,
            [orderId, booking.id, isSettlement ? "SETTLEMENT" : "DP", paymentAmount]
        );

        const snap = new midtransClient.Snap({
            isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
            serverKey,
        });
        const transaction = await snap.createTransaction({
            transaction_details: {
                order_id: orderId,
                gross_amount: paymentAmount,
            },
            customer_details: {
                first_name: booking.customer_name,
                phone: booking.phone_number,
            },
            custom_expiry: {
                expiry_duration: 2,
                unit: "minute",
            },
        });

        await db.query(
            "UPDATE midtrans_payment_transactions SET transaction_status = 'PENDING' WHERE order_id = ? AND transaction_status = 'CREATED'",
            [orderId]
        );
        return res.json({ token: transaction.token });
    } catch (error) {
        if (orderId) {
            try {
                await db.query(
                    "UPDATE midtrans_payment_transactions SET transaction_status = 'TOKEN_FAILED' WHERE order_id = ? AND transaction_status = 'CREATED'",
                    [orderId]
                );
            } catch (updateError) {
                console.error("Gagal memperbarui status pembuatan transaksi Midtrans:", updateError);
            }
        }
        console.error("Error Generating Midtrans Token:", error);
        return res.status(500).json({ message: "Gagal memproses ke payment gateway." });
    }
};

export const handleMidtransNotification = async (req, res) => {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
        console.error("MIDTRANS_SERVER_KEY belum dikonfigurasi.");
        return res.status(503).json({ message: "Layanan pembayaran belum dikonfigurasi." });
    }

    const notification = req.body;
    if (!verifyNotificationSignature(notification, serverKey)) {
        return res.status(401).json({ message: "Signature notifikasi tidak valid." });
    }

    try {
        const snap = new midtransClient.Snap({
            isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
            serverKey,
        });
        const verifiedTransaction = await snap.transaction.status(notification.order_id);
        const notifiedAmount = Number(notification.gross_amount);
        const verifiedAmount = Number(verifiedTransaction.gross_amount);

        if (
            verifiedTransaction.order_id !== notification.order_id
            || !Number.isFinite(notifiedAmount)
            || notifiedAmount <= 0
            || verifiedAmount !== notifiedAmount
        ) {
            return res.status(409).json({ message: "Data transaksi Midtrans tidak cocok dengan notifikasi." });
        }

        const transactionStatus = getNotificationResult(verifiedTransaction);
        if (!transactionStatus) {
            console.warn("Status transaksi Midtrans terverifikasi tetapi tidak diproses:", verifiedTransaction.transaction_status);
            return res.status(200).json({ status: "IGNORED" });
        }
        if (
            ["SETTLEMENT", "CAPTURE"].includes(transactionStatus)
            && verifiedTransaction.status_code !== "200"
        ) {
            return res.status(409).json({ message: "Kode status transaksi berhasil tidak valid." });
        }

        const [paymentRows] = await db.query(
            `SELECT payment.booking_id,
                    DATE_FORMAT(booking.booking_date, '%Y-%m-%d') AS booking_date
             FROM midtrans_payment_transactions AS payment
             JOIN bookings AS booking ON booking.id = payment.booking_id
             WHERE payment.order_id = ?`,
            [notification.order_id]
        );
        if (paymentRows.length === 0) {
            return res.status(404).json({ message: "Order pembayaran tidak ditemukan." });
        }

        const result = await withBookingDateLock(db, paymentRows[0].booking_date, async (connection) => {
            await connection.beginTransaction();
            try {
                const [transactions] = await connection.query(
                    `SELECT order_id, booking_id, payment_type, gross_amount,
                            transaction_status
                     FROM midtrans_payment_transactions
                     WHERE order_id = ?
                     FOR UPDATE`,
                    [notification.order_id]
                );
                const payment = transactions[0];
                if (!payment) {
                    await connection.rollback();
                    return { statusCode: 404, message: "Order pembayaran tidak ditemukan." };
                }

                if (Number(payment.gross_amount) !== notifiedAmount) {
                    await connection.rollback();
                    return { statusCode: 400, message: "Nominal notifikasi tidak sesuai dengan order." };
                }

                if (["SETTLEMENT", "CAPTURE", "PAID_REVIEW"].includes(payment.transaction_status)) {
                    await connection.commit();
                    return { statusCode: 200 };
                }

                const [bookings] = await connection.query(
                    `SELECT id, DATE_FORMAT(booking_date, '%Y-%m-%d') AS booking_date,
                            start_time, end_time, dp_amount, status
                     FROM bookings
                     WHERE id = ?
                     FOR UPDATE`,
                    [payment.booking_id]
                );
                const booking = bookings[0];
                if (!booking) {
                    await connection.rollback();
                    return { statusCode: 404, message: "Booking untuk order tidak ditemukan." };
                }

                if (!["SETTLEMENT", "CAPTURE"].includes(transactionStatus)) {
                    await connection.query(
                        `UPDATE midtrans_payment_transactions
                         SET transaction_status = ?, fraud_status = ?, midtrans_transaction_id = ?
                         WHERE order_id = ?`,
                        [
                            transactionStatus,
                            verifiedTransaction.fraud_status || null,
                            verifiedTransaction.transaction_id || null,
                            notification.order_id,
                        ]
                    );
                    await connection.commit();
                    return { statusCode: 200 };
                }

                const totalPrice = getBookingTotal(booking);
                const dpAmount = booking.dp_amount === null || booking.dp_amount === undefined
                    ? totalPrice * 0.25
                    : Number(booking.dp_amount);
                const expectedAmount = payment.payment_type === "DP"
                    ? dpAmount
                    : totalPrice - dpAmount;
                const expectedBookingStatus = payment.payment_type === "DP" ? "PENDING_DP" : "BOOKED";

                if (
                    !Number.isInteger(totalPrice)
                    || !Number.isInteger(expectedAmount)
                    || Number(payment.gross_amount) !== expectedAmount
                ) {
                    await connection.rollback();
                    return { statusCode: 400, message: "Nominal transaksi tidak sesuai dengan nilai booking." };
                }

                if (booking.status !== expectedBookingStatus) {
                    await connection.query(
                        `UPDATE midtrans_payment_transactions
                         SET transaction_status = 'PAID_REVIEW', fraud_status = ?,
                             midtrans_transaction_id = ?
                         WHERE order_id = ?`,
                        [
                            verifiedTransaction.fraud_status || null,
                            verifiedTransaction.transaction_id || null,
                            notification.order_id,
                        ]
                    );
                    await connection.commit();
                    console.error(
                        `Pembayaran ${notification.order_id} diterima tetapi status booking ${booking.id} adalah ${booking.status}; perlu pemeriksaan manual.`
                    );
                    return { statusCode: 200 };
                }

                if (payment.payment_type === "SETTLEMENT" && dpAmount >= totalPrice) {
                    await connection.rollback();
                    return { statusCode: 409, message: "Booking tidak memiliki sisa pelunasan." };
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
                    [booking.booking_date, booking.id, booking.end_time, booking.start_time]
                );

                if (conflicts.length > 0) {
                    await connection.query(
                        "UPDATE bookings SET status = 'CANCELLED' WHERE id = ? AND status = 'PENDING_DP'",
                        [booking.id]
                    );
                    await connection.query(
                        `UPDATE midtrans_payment_transactions
                         SET transaction_status = 'PAID_REVIEW', fraud_status = ?,
                             midtrans_transaction_id = ?
                         WHERE order_id = ?`,
                        [
                            verifiedTransaction.fraud_status || null,
                            verifiedTransaction.transaction_id || null,
                            notification.order_id,
                        ]
                    );
                    await connection.commit();
                    console.error(
                        `Pembayaran ${notification.order_id} diterima tetapi booking ${booking.id} bentrok dengan jadwal lain; perlu pemeriksaan/refund manual.`
                    );
                    return { statusCode: 200 };
                }

                const nextBookingStatus = payment.payment_type === "SETTLEMENT" || dpAmount === totalPrice
                    ? "BOOKED_PAID"
                    : "BOOKED";
                await connection.query(
                    "UPDATE bookings SET status = ? WHERE id = ? AND status = ?",
                    [nextBookingStatus, booking.id, expectedBookingStatus]
                );

                if (payment.payment_type === "DP") {
                    await connection.query(
                        `UPDATE bookings
                         SET status = 'CANCELLED'
                         WHERE booking_date = ?
                           AND id != ?
                           AND status = 'PENDING_DP'
                           AND start_time < ?
                           AND end_time > ?`,
                        [booking.booking_date, booking.id, booking.end_time, booking.start_time]
                    );
                }

                await connection.query(
                    `UPDATE midtrans_payment_transactions
                     SET transaction_status = ?, fraud_status = ?, midtrans_transaction_id = ?
                     WHERE order_id = ?`,
                    [
                        transactionStatus,
                        verifiedTransaction.fraud_status || null,
                        verifiedTransaction.transaction_id || null,
                        notification.order_id,
                    ]
                );
                await connection.commit();
                return { statusCode: 200 };
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        });

        if (result.statusCode !== 200) {
            return res.status(result.statusCode).json({ message: result.message });
        }
        return res.status(200).json({ status: "OK" });
    } catch (error) {
        console.error("Error memproses notifikasi Midtrans:", error);
        return res.status(500).json({ message: "Gagal memproses notifikasi pembayaran." });
    }
};
