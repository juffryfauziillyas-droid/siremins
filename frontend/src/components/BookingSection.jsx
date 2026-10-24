import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Calendar, Clock, User, Phone, Layers, CreditCard, Sparkles, X, ShieldCheck
} from "lucide-react";

export default function BookingSection({
                                           onClose, selectedDate, setSelectedDate, timeSlots, getSlotStatus,
                                           formData, setFormData, onUpdateBookingTime, onBookingConfirmed, duration
                                       }) {
    const API_URL = "http://localhost:5000/api";

    const [pricing, setPricing] = useState(null);
    const [pricingError, setPricingError] = useState("");
    const totalPrice = pricing?.packages?.[duration] || 0;
    const minimalDP = totalPrice * (pricing?.minimumDpRate || 0);

    const [dpAmount, setDpAmount] = useState(minimalDP);

    useEffect(() => {
        let isActive = true;
        axios.get(`${API_URL}/booking-pricing`)
            .then(({ data }) => {
                if (!data?.packages || !Number.isFinite(data.minimumDpRate)) {
                    throw new Error("Format data harga booking tidak valid.");
                }
                if (isActive) setPricing(data);
            })
            .catch((error) => {
                console.error("Gagal memuat harga booking:", error);
                if (isActive) {
                    setPricingError("Harga booking gagal dimuat. Silakan tutup dan buka kembali formulir booking.");
                }
            });
        return () => {
            isActive = false;
        };
    }, []);

    // 1. KUNCI KALENDER (Hanya dari tanggal besok / H+1)
    const tomorrowDateString = (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    })();

    // 2. RESET FORM SAAT TANGGAL DIGANTI
    useEffect(() => {
        setFormData((prev) => ({ ...prev, start_time: "", end_time: "" }));
    }, [selectedDate, setFormData]);

    useEffect(() => {
        setDpAmount(minimalDP);
        setFormData((prev) => ({ ...prev, dp_amount: minimalDP }));
    }, [minimalDP, setFormData]);

    const isDpValid = Boolean(pricing)
        && dpAmount >= minimalDP
        && dpAmount <= totalPrice;

    const handleDpChange = (e) => {
        const value = parseInt(e.target.value) || 0;
        setDpAmount(value);
        setFormData((prev) => ({ ...prev, dp_amount: value }));
    };

    // 4. FUNGSI CEK TABRAKAN JADWAL
    const handleTimeSelection = (time, reqDuration) => {
        const startHour = parseInt(time.split(":")[0], 10);
        let isOverlap = false;

        for (let i = 0; i < reqDuration; i++) {
            const checkTime = `${(startHour + i).toString().padStart(2, "0")}:00`;
            const s = getSlotStatus(checkTime);
            if (s === "BOOKED" || s === "BOOKED_PAID") {
                isOverlap = true;
                break;
            }
        }

        if (isOverlap) {
            toast.error(`Gagal! Durasi ${reqDuration} jam akan menabrak jadwal yang sudah terpesan.`);
            return;
        }

        onUpdateBookingTime(time, reqDuration);
    };

    // ===============================================
    // LOGIKA PEMBAYARAN MIDTRANS
    // ===============================================
    const handleCheckoutMidtrans = async (e) => {
        e.preventDefault();
        if (!isDpValid || !formData.start_time) return;

        const toastId = toast.loading("Menghubungkan ke sistem pembayaran...");

        try {
            const resBooking = await axios.post(`${API_URL}/bookings`, {
                ...formData,
                dp_amount: dpAmount,
                booking_date: selectedDate
            });
            const currentBookingId = resBooking.data.bookingId;

            const resToken = await axios.post(`${API_URL}/payment/token`, {
                booking_id: currentBookingId
            });

            toast.dismiss(toastId);
            let paymentAccepted = false;

            window.snap.pay(resToken.data.token, {
                onSuccess: async function () {
                    paymentAccepted = true;
                    toast.success("Pembayaran diterima Midtrans. Menunggu verifikasi server.");
                    try {
                        await onBookingConfirmed();
                        window.setTimeout(() => {
                            onBookingConfirmed().catch((error) => {
                                console.error("Gagal memperbarui slot setelah verifikasi pembayaran:", error);
                            });
                        }, 2500);
                    } catch (error) {
                        console.error("Gagal memperbarui slot setelah pembayaran:", error);
                        toast.error("Daftar slot gagal diperbarui.");
                    }
                },
                onPending: function (result) {
                    toast.info("Menunggu pembayaran Anda diselesaikan.");
                },
                onError: function (result) {
                    toast.error("Pembayaran gagal. Silakan ulangi pemesanan.");
                },
                onClose: function () {
                    if (!paymentAccepted) {
                        toast("Booking tetap Pending DP. Lanjutkan pembayaran melalui My Booking.");
                    }
                }
            });

        } catch (error) {
            const errorMsg = error.response?.data?.message || "Gagal menghubungkan ke Payment Gateway.";
            toast.error(errorMsg, { id: toastId });
            console.error(error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-emerald-500 selection:text-slate-950">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>

            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-5xl bg-white dark:bg-slate-900 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl rounded-[2rem] p-6 sm:p-8 overflow-hidden max-h-[95vh] overflow-y-auto custom-scrollbar">

                {/* HEADER */}
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 border-b border-slate-200 dark:border-white/10 pb-5">
                    <div>
                        <div className="inline-flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold uppercase tracking-widest mb-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            <Sparkles className="w-3.5 h-3.5" /><span>Live Reservation</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Booking Lapangan</h2>
                    </div>
                    <button onClick={onClose} className="hidden sm:flex p-3 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-rose-500/20 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-all"><X className="w-5 h-5" /></button>
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* KOLOM KIRI: KALENDER & WAKTU */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-slate-50 dark:bg-black/40 p-5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-inner">
                            <label className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider"><Calendar className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" /> Pilih Tanggal</label>

                            <input
                                type="date"
                                min={tomorrowDateString}
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                onKeyDown={(e) => e.preventDefault()} // MENCEGAH KETIK MANUAL
                                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition-all cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                            />
                        </div>

                        {/* LEGENDA STATUS TAMBAHAN */}
                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold bg-slate-50 dark:bg-black/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300">
                            <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.6)]"></span><span>Tersedia</span></div>
                            <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.6)]"></span><span>Terpesan / DP</span></div>
                        </div>

                        <div className="bg-slate-50 dark:bg-black/40 p-5 rounded-3xl border border-slate-200 dark:border-white/5">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider flex items-center"><Clock className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" /> Slot Waktu</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                {timeSlots.map((time) => {
                                    const status = getSlotStatus(time);
                                    const isSelected = formData.start_time === time;

                                    const isBooked = status !== "AVAILABLE";
                                    let btnClass = "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-500 hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500 dark:hover:text-slate-900";

                                    if (isBooked) {
                                        btnClass = "bg-rose-100 text-rose-700 border-rose-300 cursor-not-allowed dark:bg-rose-500/25 dark:text-rose-400 dark:border-rose-500/60";
                                    } else if (isSelected) {
                                        btnClass = "bg-emerald-400 text-slate-950 font-black shadow-[0_0_15px_rgba(52,211,153,0.5)] border-transparent scale-105";
                                    }

                                    const isDisabled = status !== "AVAILABLE";
                                    const statusLabel = isBooked ? "Booked" : undefined;

                                    return (
                                        <span key={time} title={statusLabel} className="block">
                                            <button
                                                type="button"
                                                disabled={isDisabled}
                                                onClick={() => handleTimeSelection(time, duration)}
                                                className={`w-full p-2.5 rounded-xl border transition-all duration-200 text-sm font-bold ${btnClass}`}
                                            >
                                                {time}
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* KOLOM KANAN: FORM & CHECKOUT */}
                    <div className="lg:col-span-5 flex flex-col h-full">
                        <form onSubmit={handleCheckoutMidtrans} className="flex flex-col flex-grow bg-slate-50 dark:bg-white/5 p-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-inner">
                            <div className="space-y-4 mb-5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nama Pemesan</label>
                                        <div className="relative"><User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" /><input type="text" required value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} className="w-full pl-10 pr-3 py-3 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all text-xs font-medium" /></div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">No. WhatsApp</label>
                                        <div className="relative"><Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" /><input type="tel" disabled value={formData.phone_number || "-"} className="w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl text-slate-500 dark:text-slate-400 transition-all text-xs font-bold cursor-not-allowed" /></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Durasi Sewa</label>
                                        <div className="relative"><Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                                            <select disabled={!formData.start_time} value={duration} onChange={(e) => handleTimeSelection(formData.start_time, parseInt(e.target.value))} className="w-full pl-9 pr-2 py-3 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all text-xs font-bold cursor-pointer disabled:opacity-50">
                                                {Object.entries(pricing?.packages || {}).map(([hours, price]) => (
                                                    <option key={hours} value={hours}>
                                                        {hours} Jam (Rp {price.toLocaleString("id-ID")})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">Nominal DP {!isDpValid && dpAmount > 0 && <span className="text-rose-600 dark:text-rose-400">Min. 25%</span>}</label>
                                        <div className="relative"><span className="absolute left-3 top-3.5 text-slate-400 text-xs font-black">Rp</span><input type="number" min={minimalDP} max={totalPrice} disabled={!formData.start_time} value={dpAmount} onChange={handleDpChange} className={`w-full pl-9 pr-2 py-3 bg-white dark:bg-black/40 border ${!isDpValid && dpAmount > 0 ? 'border-rose-500/50 focus:border-rose-500' : 'border-slate-300 dark:border-white/10 focus:border-emerald-500'} rounded-xl text-slate-900 dark:text-white focus:outline-none transition-all text-xs font-bold disabled:opacity-50`} /></div>
                                    </div>
                                </div>
                            </div>

                            {/* CARD RINGKASAN HARGA */}
                            <div className="mt-auto bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/30 dark:to-slate-900/60 p-5 rounded-2xl border border-emerald-500/20 mb-5 shadow-md">
                                <h4 className="text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest mb-3 flex items-center">
                                    <CreditCard className="w-4 h-4 mr-2" /> Kalkulasi Biaya
                                </h4>

                                {pricingError && <p className="mb-3 text-xs font-bold text-rose-600 dark:text-rose-400">{pricingError}</p>}
                                {!pricing && !pricingError && <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Memuat harga booking...</p>}

                                <div className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-300 mb-1.5">
                                    <span>Tarif Sewa ({duration} Jam)</span><span className="font-bold">Rp {totalPrice.toLocaleString("id-ID")}</span>
                                </div>

                                <div className="flex justify-between items-center text-[11px] text-amber-600 dark:text-amber-400 mb-3 pb-3 border-b border-slate-200 dark:border-white/10">
                                    <span>DP Dibayarkan (Min. 25%)</span><span className="font-black text-sm">Rp {dpAmount.toLocaleString("id-ID")}</span>
                                </div>

                                <div className="flex justify-between items-end">
                                    <span className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">Sisa Pelunasan</span>
                                    <span className="text-xl font-black text-slate-900 dark:text-white">Rp {Math.max(0, totalPrice - dpAmount).toLocaleString("id-ID")}</span>
                                </div>
                            </div>

                            {/* TOMBOL BAYAR MIDTRANS */}
                            <button
                                type="submit"
                                disabled={!pricing || Boolean(pricingError) || !formData.start_time || !isDpValid}
                                className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all text-xs uppercase tracking-widest disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-600 cursor-pointer"
                            >
                                <ShieldCheck className="w-4 h-4 mr-2" /> Lanjutkan Pembayaran (Midtrans)
                            </button>
                        </form>
                    </div>
                </div>
            </motion.div>

            <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15,23,42,0.06); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.35); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.55); }
        html.dark .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        html.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        html.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}} />
        </div>
    );
}