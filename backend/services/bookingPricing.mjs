export const BOOKING_PACKAGE_PRICES = Object.freeze({
    1: 200000,
    2: 375000,
    3: 550000,
});

export const MINIMUM_DP_RATE = 0.25;

export const getBookingTotal = (booking) => {
    const startHour = Number(String(booking.start_time).split(":")[0]);
    let endHour = Number(String(booking.end_time).split(":")[0]);
    if (endHour === 0) endHour = 24;
    return BOOKING_PACKAGE_PRICES[endHour - startHour] ?? null;
};

export const getBookingPaymentSummary = (booking) => {
    const totalPrice = getBookingTotal(booking);
    if (totalPrice === null) {
        return {
            total_price: null,
            dp_paid_amount: null,
            remaining_balance: null,
        };
    }

    const dpAmount = booking.dp_amount === null || booking.dp_amount === undefined
        ? totalPrice * MINIMUM_DP_RATE
        : Number(booking.dp_amount);
    if (!Number.isInteger(dpAmount) || dpAmount < 0 || dpAmount > totalPrice) {
        return {
            total_price: totalPrice,
            dp_paid_amount: null,
            remaining_balance: null,
        };
    }

    return {
        total_price: totalPrice,
        dp_paid_amount: dpAmount,
        remaining_balance: totalPrice - dpAmount,
    };
};
