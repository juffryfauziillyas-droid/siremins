import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ticket, RefreshCw, CalendarDays, Clock, CheckCircle2, AlertCircle, XCircle, FileText, Repeat, Trash2, ShieldCheck, CreditCard, Wallet } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "../config/api";

const formatBookingDate = (value, options) => {
    const [year, month, day] = String(value).split("T")[0].split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("id-ID", options);
};

export default function MyBookingsModal({ currentUser, onClose }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [selectedProof, setSelectedProof] = useState(null);
    const [rescheduleData, setRescheduleData] = useState(null);
    const [pelunasanData, setPelunasanData] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [newStartTime, setNewStartTime] = useState("");
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    const getPaymentDeadlineCountdown = (booking) => {
        let deadline;
        if (booking.status === "PENDING_DP" && booking.created_at) {
            const createdAt = String(booking.created_at);
            deadline = new Date(createdAt.endsWith("Z") ? createdAt : `${createdAt.replace(" ", "T")}Z`);
            deadline.setHours(deadline.getHours() + 1);
        } else {
            const date = String(booking.booking_date || "").split("T")[0];
            const timeParts = String(booking.start_time || "").split(":");
            if (!date || timeParts.length < 2) return null;

            const startHours = String(timeParts[0]).padStart(2, "0");
            const startMinutes = String(timeParts[1]).padStart(2, "0");
            deadline = new Date(`${date}T${startHours}:${startMinutes}:00+07:00`);
            deadline.setHours(deadline.getHours() - 1);
        }

        const remainingMs = deadline.getTime() - now;
        if (remainingMs <= 0) return "Batas pembayaran telah berakhir";

        const totalMinutes = Math.floor(remainingMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    const fetchMyBookings = async () => {
        if (!currentUser?.phone_number) return;
        setLoading(true);
        setError("");

        try {
            const res = await axios.get(`${API_URL}/my-bookings`);

            const normalizedBookings = res.data.map((booking) => ({
                ...booking,
                booking_date: booking.booking_date_local || String(booking.booking_date).split("T")[0],
            }));
            const sortedBookings = normalizedBookings.sort((a, b) => {
                const dateOnlyA = a.booking_date;
                const dateOnlyB = b.booking_date;
                const timeA = new Date(`${dateOnlyA}T${a.start_time}`);
                const timeB = new Date(`${dateOnlyB}T${b.start_time}`);
                return timeA - timeB;
            });

            setBookings(sortedBookings);
        } catch (err) {
            console.error(err);
            setError("Gagal memuat data bookingan Anda. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyBookings();
    }, [currentUser]);

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm("Apakah Anda yakin ingin membatalkan jadwal ini?")) return;
        const toastId = toast.loading("Memproses pembatalan...");
        try {
            await axios.put(`${API_URL}/bookings/${bookingId}/status`, { status: "CANCELLED" });
            toast.success("Jadwal berhasil dibatalkan.", { id: toastId });
            fetchMyBookings();
        } catch (err) {
            toast.error("Gagal membatalkan jadwal.", { id: toastId });
        }
    };

    const openRescheduleModal = async (booking) => {
        setRescheduleData(booking);
        setNewStartTime("");
        const toastId = toast.loading("Mencari slot kosong di hari yang sama...");

        try {
            const targetDate = booking.booking_date;
            const checkRes = await axios.get(`${API_URL}/bookings`, {
                params: {
                    date: targetDate,
                    exclude_booking_id: booking.id,
                },
            });
            const activeBookings = checkRes.data.filter((otherBooking) => {
                const status = String(otherBooking.status || "").trim().toUpperCase();
                const otherBookingDate = String(otherBooking.booking_date || "").split("T")[0];
                return (
                    otherBookingDate === targetDate &&
                    (status === "BOOKED" || status === "BOOKED_PAID")
                );
            });

            const oldStartH = parseInt(booking.start_time.split(":")[0], 10);
            let oldEndH = parseInt(booking.end_time.split(":")[0], 10);
            if (oldEndH === 0) oldEndH = 24;
            const duration = oldEndH - oldStartH;

            const toMinutes = (time) => {
                const [hours, minutes = "00"] = String(time).split(":");
                const parsedHours = Number(hours);
                return (parsedHours === 0 && Number(minutes) === 0 ? 24 : parsedHours) * 60
                    + Number(minutes);
            };

            const allSlots = [
                "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
                "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
                "20:00", "21:00", "22:00", "23:00"
            ];

            const validSlots = allSlots.filter((time) => {
                const candidateStart = toMinutes(time);
                const candidateEnd = candidateStart + duration * 60;
                if (candidateEnd > 24 * 60) return false;

                return !activeBookings.some((otherBooking) => {
                    const bookedStart = toMinutes(otherBooking.start_time);
                    const bookedEnd = toMinutes(otherBooking.end_time);
                    return candidateStart < bookedEnd && candidateEnd > bookedStart;
                });
            });

            setAvailableSlots(validSlots);
            toast.dismiss(toastId);
        } catch (err) {
            toast.error("Gagal memuat slot ketersediaan.", { id: toastId });
        }
    };

    const handleExecuteReschedule = async (e) => {
        e.preventDefault();
        if (!newStartTime) return toast.error("Pilih jam pengganti terlebih dahulu.");
        const toastId = toast.loading("Memindahkan jadwal...");
        try {
            const oldStartH = parseInt(rescheduleData.start_time.split(":")[0], 10);
            let oldEndH = parseInt(rescheduleData.end_time.split(":")[0], 10);
            if (oldEndH === 0) oldEndH = 24;
            const duration = oldEndH - oldStartH;
            const newStartH = parseInt(newStartTime.split(":")[0], 10);
            let newEndH = newStartH + duration;
            if (newEndH === 24) newEndH = 0;
            const newEndTime = `${newEndH.toString().padStart(2, "0")}:00`;

            await axios.put(`${API_URL}/bookings/${rescheduleData.id}/reschedule`, {
                start_time: newStartTime,
                end_time: newEndTime
            });
            toast.success("Jadwal berhasil dipindahkan!", { id: toastId });
            setRescheduleData(null);
            fetchMyBookings();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Gagal mengganti jadwal.";
            toast.error(errorMsg, { id: toastId });
        }
    };

    const handleContinuePayment = async (booking) => {
        const toastId = toast.loading("Mempersiapkan pembayaran...");
        try {
            const resToken = await axios.post(`${API_URL}/payment/token`, {
                booking_id: booking.id
            });

            toast.dismiss(toastId);
            let paymentAccepted = false;
            window.snap.pay(resToken.data.token, {
                onSuccess: async function () {
                    paymentAccepted = true;
                    toast.success("Pembayaran diterima Midtrans. Menunggu verifikasi server.");
                    fetchMyBookings();
                    window.setTimeout(fetchMyBookings, 2500);
                },
                onPending: function () { toast.info("Menunggu pembayaran diselesaikan."); },
                onError: function () { toast.error("Pembayaran gagal."); },
                onClose: function () {
                    if (!paymentAccepted) toast("Jendela pembayaran ditutup.");
                }
            });
        } catch (err) {
            toast.error("Gagal membuka gerbang pembayaran.", { id: toastId });
        }
    };

    const handleExecutePelunasan = async () => {
        if (!pelunasanData) return;
        if (
            !Number.isInteger(Number(pelunasanData.remaining_balance))
            || Number(pelunasanData.remaining_balance) <= 0
        ) {
            toast.error("Rincian pelunasan booking tidak tersedia atau sudah lunas.");
            return;
        }
        const toastId = toast.loading("Menghubungkan ke sistem pembayaran...");

        try {
            const resToken = await axios.post(`${API_URL}/payment/token`, {
                booking_id: `LUNAS-${pelunasanData.id}`
            });

            toast.dismiss(toastId);
            setPelunasanData(null);

            window.snap.pay(resToken.data.token, {
                onSuccess: async function () {
                    toast.success("Pembayaran diterima Midtrans. Menunggu verifikasi server.");
                    fetchMyBookings();
                    window.setTimeout(fetchMyBookings, 2500);
                },
                onPending: function () { toast.info("Menunggu pelunasan diselesaikan."); },
                onError: function () { toast.error("Pelunasan gagal diproses."); },
                onClose: function () { toast("Jendela pembayaran ditutup."); }
            });
        } catch (err) {
            toast.error("Gagal membuka gerbang pembayaran.", { id: toastId });
        }
    };

    //format jam mulai & durasi sewa
    const formatBookingTime = (startTime, endTime) => {
        if (!startTime) return "-";
        const startHour = parseInt(startTime.split(":")[0], 10);
        const startMinute = startTime.split(":")[1] || "00";
        const formattedStart = `${startHour.toString().padStart(2, "0")}:${startMinute}`;

        let endHour = endTime ? parseInt(endTime.split(":")[0], 10) : startHour + 1;
        if (endHour === 0) endHour = 24;

        const duration = Math.max(1, endHour - startHour);
        return `${formattedStart} WIB (${duration} Jam)`;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'BOOKED_PAID': // Status baru untuk BOOKED & PAID
                return { color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', icon: <CheckCircle2 className="w-3 h-3 mr-1" /> };
            case 'BOOKED':
                return { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', icon: <CheckCircle2 className="w-3 h-3 mr-1" /> };
            case 'PENDING_DP':
                return { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', icon: <AlertCircle className="w-3 h-3 mr-1" /> };
            case 'CANCELLED':
            case 'REJECTED':
                return { color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30', border: 'border-rose-200 dark:border-rose-800', icon: <XCircle className="w-3 h-3 mr-1" /> };
            default:
                return { color: 'text-slate-700 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', icon: null };
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
            <div className="absolute inset-0" onClick={onClose} />

            <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} className="relative bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-2xl z-10 my-auto">
                <button onClick={onClose} type="button" className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer">
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center justify-between gap-3 mb-6 pr-12">
                    <div className="flex items-center space-x-3">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Ticket className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Riwayat Booking</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Kelola jadwal lapangan yang telah Anda pesan</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={fetchMyBookings}
                        disabled={loading}
                        title="Refresh daftar booking"
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-blue-600 transition-colors hover:bg-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:text-white"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                <div className="min-h-[250px] max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center items-center h-full py-10"><RefreshCw className="w-8 h-8 text-slate-400 animate-spin" /></div>
                    ) : error ? (
                        <div className="flex justify-center items-center h-full py-10"><p className="text-rose-500 text-sm font-bold">{error}</p></div>
                    ) : bookings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-center space-y-3">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-400 mb-2">
                                <Ticket className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="text-slate-900 dark:text-white font-bold">Belum ada riwayat pesanan.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {bookings.map((b) => {
                                const statusStyle = getStatusStyle(b.status);
                                const isPending = b.status === 'PENDING_DP';
                                const isBooked = b.status === 'BOOKED';
                                const isBookedPaid = b.status === 'BOOKED_PAID';
                                const canReschedule = isPending || isBooked || isBookedPaid;

                                return (
                                    <div key={b.id} className="group flex flex-col p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                                                    <CalendarDays className="w-4 h-4 text-blue-500 dark:text-emerald-500" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">
                                                        {formatBookingDate(b.booking_date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2 text-slate-900 dark:text-white">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-black tracking-tight">{formatBookingTime(b.start_time, b.end_time)}</span>
                                                </div>
                                                    {(isPending || isBooked) && (
                                                        <div className={`text-[11px] font-bold ${getPaymentDeadlineCountdown(b) === "Batas pembayaran telah berakhir" ? "text-rose-600" : "text-amber-600 dark:text-amber-400"}`}>
                                                            Batas pembayaran: {getPaymentDeadlineCountdown(b)}
                                                        </div>
                                                    )}
                                                    <p className="text-[10px] text-slate-400 font-medium">ID: #{b.id} • Atas Nama: <span className="font-bold text-slate-600 dark:text-slate-300">{b.customer_name}</span></p>
                                            </div>
                                            <div className="mt-3 sm:mt-0">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                                                    {statusStyle.icon}
                                                    {b.status === 'BOOKED_PAID' ? 'BOOKED & PAID' : b.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* TOMBOL AKSI */}
                                        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                                            {isPending && (
                                                <button onClick={() => handleContinuePayment(b)} className="flex items-center justify-center flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-md">
                                                    <CreditCard className="w-3 h-3 mr-1.5" /> Lanjutkan Pembayaran DP
                                                </button>
                                            )}

                                            {isBooked && (
                                                <button onClick={() => setPelunasanData(b)} className="flex items-center justify-center flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-md">
                                                    <Wallet className="w-3 h-3 mr-1.5" /> Bayar Pelunasan
                                                </button>
                                            )}

                                            {(isBooked || isBookedPaid) && (
                                                <button onClick={() => setSelectedProof(b)} className="flex items-center justify-center flex-1 sm:flex-none bg-blue-500/10 hover:bg-blue-500 text-blue-600 dark:text-blue-400 hover:text-white py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border border-blue-500/20">
                                                    <FileText className="w-3 h-3 mr-1.5" /> E-Tiket
                                                </button>
                                            )}

                                            {canReschedule && (
                                                <button onClick={() => openRescheduleModal(b)} className="flex items-center justify-center flex-1 sm:flex-none bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-white py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border border-amber-500/20">
                                                    <Repeat className="w-3 h-3 mr-1.5" /> Ganti Jam
                                                </button>
                                            )}

                                            {(isBooked || isPending) && (
                                                <button onClick={() => handleCancelBooking(b.id)} className="flex items-center justify-center flex-1 sm:flex-none bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border border-rose-500/20">
                                                    <Trash2 className="w-3 h-3 mr-1.5" /> Batalkan
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* MODAL KECIL: RINCIAN PELUNASAN */}
            <AnimatePresence>
                {pelunasanData && (
                    <div className="absolute inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
                            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 flex items-center">
                                <Wallet className="w-5 h-5 text-emerald-500 mr-2" /> Rincian Pelunasan
                            </h3>

                            {(() => {
                                const totalPrice = Number(pelunasanData.total_price);
                                const dpAmount = Number(pelunasanData.dp_paid_amount);
                                const sisaPelunasan = Number(pelunasanData.remaining_balance);
                                const hasPricing = pelunasanData.total_price !== null
                                    && pelunasanData.dp_paid_amount !== null
                                    && pelunasanData.remaining_balance !== null
                                    && Number.isInteger(totalPrice)
                                    && Number.isInteger(dpAmount)
                                    && Number.isInteger(sisaPelunasan);
                                const startHour = Number(pelunasanData.start_time.split(":")[0]);
                                const endHourValue = Number(pelunasanData.end_time.split(":")[0]);
                                const endHour = endHourValue === 0 ? 24 : endHourValue;
                                const duration = endHour - startHour;

                                return (
                                    <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                                        {!hasPricing && <p className="text-rose-600 dark:text-rose-400">Rincian harga tidak tersedia.</p>}
                                        <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <span>Tarif Sewa ({duration} Jam)</span>
                                            <strong className="text-slate-900 dark:text-white">{hasPricing ? `Rp ${totalPrice.toLocaleString("id-ID")}` : "-"}</strong>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 text-emerald-600 dark:text-emerald-400">
                                            <span>DP Dibayarkan</span>
                                            <strong>{hasPricing ? `- Rp ${dpAmount.toLocaleString("id-ID")}` : "-"}</strong>
                                        </div>
                                        <div className="flex justify-between pt-2">
                                            <span className="font-bold uppercase tracking-wider">Sisa Pelunasan</span>
                                            <strong className="text-lg font-black text-rose-500">{hasPricing ? `Rp ${sisaPelunasan.toLocaleString("id-ID")}` : "-"}</strong>
                                        </div>

                                        <div className="pt-5 flex space-x-2">
                                            <button onClick={() => setPelunasanData(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer">
                                                Batal
                                            </button>
                                            <button onClick={handleExecutePelunasan} disabled={!hasPricing || sisaPelunasan <= 0} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50">
                                                <CreditCard className="w-3 h-3 mr-1" /> Bayar (Midtrans)
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL KECIL: E-TIKET */}
            <AnimatePresence>
                {selectedProof && (
                    <div className="absolute inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
                            <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                                <ShieldCheck className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">E-Tiket Reservasi</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cikajang Sport Center</p>
                            </div>
                            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1"><span>ID Pesanan:</span><strong className="text-slate-900 dark:text-white">#{selectedProof.id}</strong></div>
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1"><span>Nama:</span><strong className="text-slate-900 dark:text-white">{selectedProof.customer_name}</strong></div>
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1"><span>Tgl Main:</span><strong className="text-slate-900 dark:text-white">{formatBookingDate(selectedProof.booking_date)}</strong></div>
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1"><span>Jam Main:</span><strong className="text-slate-900 dark:text-white">{formatBookingTime(selectedProof.start_time, selectedProof.end_time)}</strong></div>
                                <div className="flex justify-between pt-1">
                                    <span>Status:</span>
                                    <span className={`font-black uppercase tracking-wider ${selectedProof.status === 'BOOKED_PAID' ? 'text-blue-500' : 'text-emerald-500'}`}>
                                        {selectedProof.status === 'BOOKED_PAID' ? 'BOOKED & PAID' : 'DP DIBAYARKAN'}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedProof(null)} className="mt-6 w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-colors cursor-pointer">
                                Tutup Tiket
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL KECIL: GANTI JADWAL (RESCHEDULE) */}
            <AnimatePresence>
                {rescheduleData && (
                    <div className="absolute inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.form initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onSubmit={handleExecuteReschedule} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
                            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">Ganti Jam Main</h3>
                            <p className="text-[10px] text-amber-500 font-bold mb-4 uppercase tracking-widest">Tanggal Tetap: {formatBookingDate(rescheduleData.booking_date)}</p>

                            <div className="mb-5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Pilih Jam Pengganti (Tersedia)</label>
                                <select required value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white font-bold cursor-pointer outline-none focus:border-amber-500">
                                    <option value="">-- Tampilkan Jam Kosong --</option>
                                    {availableSlots.length === 0 ? (
                                        <option disabled value="">Tidak ada slot kosong untuk durasi ini</option>
                                    ) : (
                                        availableSlots.map((t) => (
                                            <option key={t} value={t}>{t} WIB</option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="flex space-x-3">
                                <button type="button" onClick={() => setRescheduleData(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer">
                                    Batal
                                </button>
                                <button type="submit" disabled={availableSlots.length === 0} className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50">
                                    Simpan Jam
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
            `}} />
        </motion.div>
    );
}