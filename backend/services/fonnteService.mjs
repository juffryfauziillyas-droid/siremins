const FONNTE_API_URL = "https://api.fonnte.com/send";

const toFonnteTarget = (phoneNumber) => {
    const digits = String(phoneNumber).replace(/\D/g, "");
    if (digits.startsWith("62") || digits.startsWith("0")) return digits;
    if (digits.startsWith("8")) return `0${digits}`;
    throw new Error("Nomor telepon bukan nomor Indonesia yang valid.");
};

export const sendPasswordResetOtp = async (phoneNumber, otp) => {
    const token = process.env.FONNTE_TOKEN;
    if (!token) {
        throw new Error("FONNTE_TOKEN belum dikonfigurasi.");
    }

    const formData = new FormData();
    formData.append("target", toFonnteTarget(phoneNumber));
    formData.append(
        "message",
        `Kode OTP reset password Siremins Anda: ${otp}. Kode berlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.`
    );
    formData.append("countryCode", "62");

    const response = await fetch(FONNTE_API_URL, {
        method: "POST",
        headers: { Authorization: token },
        body: formData,
        signal: AbortSignal.timeout(10000),
    });

    const result = await response.json();
    if (!response.ok || result?.status !== true) {
        throw new Error("Fonnte menolak pengiriman pesan OTP.");
    }
};
