import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    RefreshCw,
    Ticket,
    CreditCard,
    Repeat,
    FileText,
    ShieldCheck
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = "http://localhost:5000/api";

export default function MyBookingsModal({ currentUser, onClose }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // State untuk Modal Bukti Booking & Reschedule
    const [selectedProof, setSelectedProof] = useState(null);
    const [rescheduleData, setRescheduleData] = useState(null);
    const [newStartTime, setNewStartTime] = useState("");
    const [availableSlots, setAvailableSlots] = useState([]); // Menyimpan jam yang tersedia untuk reschedule

    const fetchMyBookings = async () => {
        if (!currentUser?.phone_number) return;
        setLoading(true);
        setError("");

        try {
            const res = await axios.get(
                `${API_URL}/my-bookings?phone_number=${currentUser.phone_number}`,
            );
            setBookings(res.data);
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

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const options = {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric",
        };
        return new Date(dateString).toLocaleDateString("id-ID", options);
    };

    const formatTime = (timeString) => {
        if (!timeString) return "";
        const [hours, minutes] = timeString.split(":");
        return `${hours}:${minutes}`;
    };

    // 1. LANJUTKAN PEMBAYARAN (Midtrans Snap)
    const handleContinuePayment = async (booking) => {
        const toastId = toast.loading("Mempersiapkan pembayaran...");
        try {
            const startH = parseInt(booking.start_time.split(":")[0], 10);
            const endH = parseInt(booking.end_time.split(":")[0], 10);
            const duration = (endH - startH + 24) % 24 || 24;
            const paketHarga = { 1: 200000, 2: 375000, 3: 550000 };
            const totalPrice = paketHarga[duration] || 200000;
            const dpAmount = totalPrice * 0.25;

            const resToken = await axios.post(`${API_URL}/payment/token`, {
                customer_name: booking.customer_name,
                phone_number: booking.phone_number,
                dp_amount: dpAmount,
                booking_id: booking.id
            });

            toast.dismiss(toastId);

            window.snap.pay(resToken.data.token, {
                onSuccess: async function () {
                    await axios.put(`${API_URL}/bookings/${booking.id}/status`, { status: "BOOKED" });
                    toast.success("Pembayaran berhasil! Status diperbarui.");
                    fetchMyBookings();
                },
                onPending: function () {
                    toast.info("Menunggu pembayaran diselesaikan.");
                },
                onError: function () {
                    toast.error("Pembayaran gagal.");
                },
                onClose: function () {
                    toast("Jendela pembayaran ditutup.");
                }
            });
        } catch (err) {
            console.error(err);
            toast.error("Gagal membuka gerbang pembayaran.", { id: toastId });
        }
    };

    // 2. BATALKAN BOOKING
    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm("Apakah Anda yakin ingin membatalkan pemesanan ini?")) return;

        const toastId = toast.loading("Memproses pembatalan...");
        try {
            await axios.put(`${API_URL}/bookings/${bookingId}/status`, { status: "CANCELLED" });
            toast.success("Pesanan berhasil dibatalkan.", { id: toastId });
            fetchMyBookings();
        } catch (err) {
            console.error(err);
            toast.error("Gagal membatalkan pesanan.", { id: toastId });
        }
    };

    // FUNGSI MEMBUKA MODAL RESCHEDULE & FILTER JAM KOSONG
    const openRescheduleModal = async (item) => {
        setRescheduleData(item);
        setNewStartTime("");

        try {
            const targetDate = item.booking_date.split("T")[0];
            const checkRes = await axios.get(`${API_URL}/bookings?date=${targetDate}`);
            const activeBookings = checkRes.data;

            // Hitung durasi jam pesanan saat ini (misal 1 jam, 2 jam, atau 3 jam)
            const oldStartH = parseInt(item.start_time.split(":")[0], 10);
            const oldEndH = parseInt(item.end_time.split(":")[0], 10);
            const duration = (oldEndH - oldStartH + 24) % 24 || 24;

            const allSlots = [
                "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
                "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
                "20:00", "21:00", "22:00", "23:00"
            ];

            // Saring slot waktu
            const validSlots = allSlots.filter((time) => {
                const startH = parseInt(time.split(":")[0], 10);

                // 1. Jangan tampilkan jam yang sama persis dengan jadwal saat ini
                if (time === item.start_time.substring(0, 5)) {
                    return false;
                }

                // 2. Cek apakah rentang durasi mencukupi dan tidak menabrak jadwal lain
                let isConflict = false;
                for (let i = 0; i < duration; i++) {
                    const checkHour = startH + i;

                    // Jika durasi melewati batas operasional malam (misal jam 23:00 ambil 2 jam), anggap invalid
                    if (checkHour > 24) {
                        isConflict = true;
                        break;
                    }

                    const conflict = activeBookings.some((b) => {
                        if (b.id === item.id) return false; // Abaikan jadwal sendiri
                        const bStart = parseInt(b.start_time.split(":")[0], 10);
                        let bEnd = parseInt(b.end_time.split(":")[0], 10);
                        if (bEnd === 0) bEnd = 24;

                        return checkHour >= bStart && checkHour < bEnd;
                    });

                    if (conflict) {
                        isConflict = true;
                        break;
                    }
                }

                return !isConflict; // Hanya ambil slot yang aman / kosong
            });

            setAvailableSlots(validSlots);
        } catch (err) {
            console.error(err);
            toast.error("Gagal memuat slot waktu kosong.");
        }
    };

    // 3. PROSES EKSEKUSI RESCHEDULE
    const handleExecuteReschedule = async (e) => {
        e.preventDefault();
        if (!newStartTime) {
            toast.error("Pilih jam pengganti terlebih dahulu.");
            return;
        }

        const toastId = toast.loading("Memindahkan jadwal...");
        try {
            const targetDate = rescheduleData.booking_date.split("T")[0];
            const oldStartH = parseInt(rescheduleData.start_time.split(":")[0], 10);
            const oldEndH = parseInt(rescheduleData.end_time.split(":")[0], 10);
            const duration = (oldEndH - oldStartH + 24) % 24 || 24;

            const newStartH = parseInt(newStartTime.split(":")[0], 10);
            const newEndH = newStartH + duration;
            const newEndTime = `${newEndH.toString().padStart(2, "0")}:00`;

            await axios.put(`${API_URL}/admin/bookings/${rescheduleData.id}`, {
                status: "BOOKED",
                booking_date: targetDate,
                start_time: newStartTime,
                end_time: newEndTime
            });

            toast.success("Jadwal berhasil diganti!", { id: toastId });
            setRescheduleData(null);
            setNewStartTime("");
            fetchMyBookings();
        } catch (err) {
            console.error(err);
            toast.error("Gagal mengganti jadwal.", { id: toastId });
        }
    };

    const renderStatusBadge = (status) => {
        const statusUpper = (status || "").toUpperCase();

        if (statusUpper === "BOOKED" || statusUpper === "APPROVED" || statusUpper === "SUCCESS") {
            return (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          <span>DIKONFIRMASI</span>
        </span>
            );
        }

        if (statusUpper === "CANCELLED" || statusUpper === "REJECTED" || statusUpper === "BATAL") {
            return (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <XCircle className="w-3 h-3" />
          <span>DIBATALKAN</span>
        </span>
            );
        }

        return (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <AlertCircle className="w-3 h-3" />
        <span>MENUNGGU DP</span>
      </span>
        );
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
            <div className="absolute inset-0" onClick={onClose} />

            <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} className="relative bg-white dark:bg-slate-950 w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 my-auto select-none max-h-[90vh] flex flex-col">

                {/* TOMBOL CLOSE */}
                <button onClick={onClose} type="button" className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer">
                    <X className="w-5 h-5" />
                </button>

                {/* HEADER */}
                <div className="flex items-center space-x-3 mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-emerald-400 border border-blue-500/20">
                        <Ticket className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Booking Saya</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Riwayat reservasi lapang Cikajang Sport Center</p>
                    </div>
                </div>

                {/* REFRESH BUTTON */}
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Booking: <strong className="text-slate-900 dark:text-white">{bookings.length}</strong></span>
                    <button type="button" onClick={fetchMyBookings} disabled={loading} className="flex items-center space-x-1.5 text-xs font-bold text-blue-600 dark:text-emerald-400 hover:underline cursor-pointer disabled:opacity-50">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /><span>Muat Ulang</span>
                    </button>
                </div>

                {/* CONTENT DAFTAR BOOKING */}
                <div className="overflow-y-auto pr-1 space-y-3 flex-1">
                    {loading ? (
                        <div className="py-12 text-center text-slate-400 text-xs font-semibold">Memuat jadwal bookingan Anda...</div>
                    ) : error ? (
                        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs text-center font-semibold">{error}</div>
                    ) : bookings.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                            <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                            <p className="text-slate-700 dark:text-slate-300 font-extrabold text-sm">Belum Ada Bookingan</p>
                            <p className="text-slate-400 text-xs mt-1">Anda belum melakukan pemesanan jadwal arena lapangan.</p>
                        </div>
                    ) : (
                        bookings.map((item) => {
                            const statusUpper = (item.status || "").toUpperCase();
                            return (
                                <div key={item.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 flex flex-col space-y-3 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-emerald-400">Mini Soccer Arena</span>
                                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5 mt-0.5">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" /><span>{formatDate(item.booking_date)}</span>
                                            </h4>
                                        </div>
                                        {renderStatusBadge(item.status)}
                                    </div>

                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                                        <div className="flex items-center space-x-1">
                                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                                            <span>{formatTime(item.start_time)} - {formatTime(item.end_time)} WIB</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">ID: #BKNG-{item.id}</span>
                                    </div>

                                    {/* TOMBOL AKSI BERDASARKAN STATUS */}
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {statusUpper === "PENDING_DP" && (
                                            <>
                                                <button onClick={() => handleContinuePayment(item)} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2 px-3 rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer">
                                                    <CreditCard className="w-3.5 h-3.5 mr-1" /> Lanjutkan Pembayaran
                                                </button>
                                                <button onClick={() => handleCancelBooking(item.id)} className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-black py-2 px-3 rounded-xl text-[10px] uppercase tracking-wider transition-all border border-rose-500/20 cursor-pointer">
                                                    Batalkan
                                                </button>
                                            </>
                                        )}

                                        {statusUpper === "BOOKED" && (
                                            <>
                                                <button onClick={() => setSelectedProof(item)} className="bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white font-black py-2 px-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all border border-blue-500/20 flex items-center cursor-pointer">
                                                    <FileText className="w-3 h-3 mr-1" /> Bukti
                                                </button>
                                                <button onClick={() => openRescheduleModal(item)} className="bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white font-black py-2 px-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all border border-amber-500/20 flex items-center cursor-pointer">
                                                    <Repeat className="w-3 h-3 mr-1" /> Ganti Jadwal
                                                </button>
                                                <button onClick={() => handleCancelBooking(item.id)} className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-black py-2 px-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all border border-rose-500/20 cursor-pointer">
                                                    Batalkan
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* MODAL KECIL: BUKTI BOOKING */}
                <AnimatePresence>
                    {selectedProof && (
                        <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl relative">
                                <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                                    <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-1" />
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Bukti Reservasi Resmi</h3>
                                    <p className="text-[10px] text-slate-400">Cikajang Sport Center</p>
                                </div>
                                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                    <div className="flex justify-between"><span>Nama Pemesan:</span><strong className="text-slate-900 dark:text-white">{selectedProof.customer_name}</strong></div>
                                    <div className="flex justify-between"><span>No WhatsApp:</span><strong className="text-slate-900 dark:text-white">{selectedProof.phone_number}</strong></div>
                                    <div className="flex justify-between"><span>Tanggal Main:</span><strong className="text-slate-900 dark:text-white">{formatDate(selectedProof.booking_date)}</strong></div>
                                    <div className="flex justify-between"><span>Jam Main:</span><strong className="text-slate-900 dark:text-white">{formatTime(selectedProof.start_time)} - {formatTime(selectedProof.end_time)} WIB</strong></div>
                                    <div className="flex justify-between"><span>Status:</span><span className="text-emerald-500 font-bold">LUNAS / TERKONFIRMASI</span></div>
                                </div>
                                <button onClick={() => setSelectedProof(null)} className="mt-5 w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-white font-bold py-2 rounded-xl text-xs cursor-pointer">
                                    Tutup Bukti
                                </button>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* MODAL KECIL: RESCHEDULE (HANYA MENAMPILKAN SLOT KOSONG & BUKAN JAM SAAT INI) */}
                <AnimatePresence>
                    {rescheduleData && (
                        <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                            <form onSubmit={handleExecuteReschedule} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl relative">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">Ganti Jam Bermain</h3>
                                <p className="text-[11px] text-amber-500 font-bold mb-3">Tanggal: {formatDate(rescheduleData.booking_date)}</p>

                                <div className="space-y-3 mb-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pilih Jam Pengganti yang Kosong</label>
                                        <select required value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold cursor-pointer">
                                            <option value="">-- Pilih Jam Tersedia --</option>
                                            {availableSlots.length === 0 ? (
                                                <option disabled value="">Tidak ada slot kosong yang cukup untuk durasi ini</option>
                                            ) : (
                                                availableSlots.map((t) => (
                                                    <option key={t} value={t}>{t} WIB</option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex space-x-2">
                                    <button type="button" onClick={() => setRescheduleData(null)} className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-white font-bold py-2 rounded-xl text-xs cursor-pointer">
                                        Batal
                                    </button>
                                    <button type="submit" disabled={availableSlots.length === 0} className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 rounded-xl text-xs cursor-pointer disabled:opacity-50">
                                        Simpan Jam Baru
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </AnimatePresence>

            </motion.div>
        </motion.div>
    );
}