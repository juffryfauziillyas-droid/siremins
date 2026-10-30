import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "../config/api";
import {
    Users,
    CalendarDays,
    Clock,
    XCircle,
    Trash2,
    Search,
    RefreshCw,
    LogOut,
    BadgeCheck
} from "lucide-react";

const getAdminRequestError = (error) => {
    const status = error.response?.status;
    if (status === 401) {
        return "Sesi admin tidak valid atau kedaluwarsa. Keluar dari akun, lalu login kembali.";
    }
    if (status === 403) {
        return "Akun ini tidak memiliki izin admin untuk memuat data.";
    }
    if (status === 503) {
        return "Autentikasi backend belum dikonfigurasi. Periksa JWT_SECRET di backend/.env lalu restart backend.";
    }
    if (status >= 500) {
        return error.response?.data?.message || "Backend gagal mengambil data. Periksa log backend dan koneksi database.";
    }
    if (!error.response) {
        return "Backend tidak dapat dihubungi. Pastikan server backend sedang berjalan.";
    }
    return error.response?.data?.message || "Permintaan data admin gagal.";
};

export default function AdminDashboard({ currentUser, onLogoutClick }) {
    const [activeTab, setActiveTab] = useState(() => {
        const savedTab = sessionStorage.getItem("siremins-admin-tab");
        return ["bookings", "schedule", "users"].includes(savedTab) ? savedTab : "bookings";
    });
    const [bookings, setBookings] = useState([]);
    const [scheduleBookings, setScheduleBookings] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bookingsError, setBookingsError] = useState("");
    const [scheduleError, setScheduleError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
    const [selectedBookingDate, setSelectedBookingDate] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    });

    // Mengambil data Booking
    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/admin/bookings`, {
                params: { date: selectedBookingDate },
            });
            setBookings(res.data);
            setBookingsError("");
        } catch (error) {
            const message = getAdminRequestError(error);
            setBookingsError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [selectedBookingDate]);

    const fetchScheduleBookings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/admin/bookings`, {
                params: { date: selectedBookingDate },
            });
            setScheduleBookings(
                res.data.filter((booking) => booking.status === "BOOKED" || booking.status === "BOOKED_PAID")
            );
            setScheduleError("");
        } catch (error) {
            const message = getAdminRequestError(error);
            setScheduleError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [selectedBookingDate]);

    // Mengambil data User
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/admin/users`);
            setUsers(res.data);
        } catch (error) {
            toast.error("Gagal memuat data pengguna.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "bookings") fetchBookings();
        if (activeTab === "schedule") fetchScheduleBookings();
        if (activeTab === "users") fetchUsers();
    }, [activeTab, fetchBookings, fetchScheduleBookings, fetchUsers]);

    useEffect(() => {
        sessionStorage.setItem("siremins-admin-tab", activeTab);
    }, [activeTab]);

    // Fungsi mengubah status booking (Terima/Tolak)
    const handleUpdateBookingStatus = async (id, newStatus) => {
        const toastId = toast.loading("Memperbarui status...");
        try {
            const response = await axios.put(`${API_URL}/admin/bookings/${id}`, { status: newStatus });
            toast.success(response.data.message || `Status berhasil diubah menjadi ${newStatus}`, { id: toastId });
            fetchBookings(); // Muat ulang data
        } catch (error) {
            toast.error("Gagal memperbarui status.", { id: toastId });
        }
    };

    const handleVerifyManualPayment = async (booking, paymentType) => {
        const label = paymentType === "DP" ? "DP menjadi BOOKED" : "pelunasan menjadi LUNAS";
        if (!window.confirm(`Verifikasi pembayaran manual ${label} untuk ${booking.customer_name}?`)) return;

        const toastId = toast.loading("Memverifikasi pembayaran manual...");
        try {
            const response = await axios.post(
                `${API_URL}/admin/bookings/${booking.id}/verify-manual-payment`,
                { payment_type: paymentType }
            );
            toast.success(response.data.message || "Pembayaran manual berhasil diverifikasi.", { id: toastId });
            fetchBookings();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal memverifikasi pembayaran manual.", { id: toastId });
        }
    };

    // Fungsi menghapus user
    const handleDeleteUser = async (id, name) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus pengguna ${name}?`)) return;

        const toastId = toast.loading("Menghapus pengguna...");
        try {
            await axios.delete(`${API_URL}/admin/users/${id}`);
            toast.success("Pengguna berhasil dihapus.", { id: toastId });
            fetchUsers(); // Muat ulang data
        } catch (error) {
            toast.error("Gagal menghapus pengguna.", { id: toastId });
        }
    };

    // Helper format jam mulai & durasi sewa
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

    // Filter pencarian
    const filteredBookings = bookings.filter((booking) => {
        const matchesSearch =
            booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.phone_number?.includes(searchTerm);
        const matchesStatus =
            bookingStatusFilter === "ALL" ||
            booking.status === bookingStatusFilter ||
            (bookingStatusFilter === "REJECTED_CANCELLED" &&
                (booking.status === "REJECTED" || booking.status === "CANCELLED"));

        return matchesSearch && matchesStatus;
    });

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone_number?.includes(searchTerm)
    );

    const scheduleSlots = Array.from({ length: 16 }, (_, index) => {
        const startMinutes = (index + 8) * 60;
        const endMinutes = startMinutes + 60;
        const hourBookings = scheduleBookings.filter((booking) => {
            const toMinutes = (time) => {
                const [hours, minutes = "00"] = String(time).split(":");
                const parsedHours = Number(hours);
                const parsedMinutes = Number(minutes);
                return parsedHours === 0 && parsedMinutes === 0
                    ? 24 * 60
                    : parsedHours * 60 + parsedMinutes;
            };
            return toMinutes(booking.start_time) < endMinutes && toMinutes(booking.end_time) > startMinutes;
        });

        return {
            label: `${String(index + 8).padStart(2, "0")}:00`,
            hourBookings,
        };
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-28 min-h-screen">

            {/* HEADER DASHBOARD */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Panel Administrator
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                        Selamat datang, <span className="font-bold text-blue-600 dark:text-emerald-400">{currentUser?.name}</span>. Kelola semua data operasional di sini.
                    </p>
                </div>

                {/* PENCARIAN & TOMBOL LOGOUT */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {activeTab !== "schedule" && (
                        <div className="relative w-full md:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                            type="text"
                            placeholder="Cari nama atau no. HP..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium shadow-sm"
                        />
                        </div>
                    )}

                    <button
                        onClick={onLogoutClick}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Keluar</span>
                    </button>
                </div>
            </div>

            {/* TABS NAVIGATION */}
            <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 mb-6">
                <button
                    onClick={() => setActiveTab("bookings")}
                    className={`flex items-center space-x-2 py-3 px-5 text-sm font-bold border-b-2 transition-all duration-200 ${
                        activeTab === "bookings"
                            ? "border-blue-600 text-blue-600 dark:border-emerald-400 dark:text-emerald-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                >
                    <CalendarDays className="w-4 h-4" />
                    <span>Kelola Booking</span>
                </button>
                <button
                    onClick={() => setActiveTab("schedule")}
                    className={`flex items-center space-x-2 py-3 px-5 text-sm font-bold border-b-2 transition-all duration-200 ${
                        activeTab === "schedule"
                            ? "border-blue-600 text-blue-600 dark:border-emerald-400 dark:text-emerald-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                >
                    <Clock className="w-4 h-4" />
                    <span>Slot & Jadwal</span>
                </button>
                <button
                    onClick={() => setActiveTab("users")}
                    className={`flex items-center space-x-2 py-3 px-5 text-sm font-bold border-b-2 transition-all duration-200 ${
                        activeTab === "users"
                            ? "border-blue-600 text-blue-600 dark:border-emerald-400 dark:text-emerald-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Data Pengguna</span>
                </button>
            </div>

            {/* LOADING STATE PADA KONTEN */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
                >
                    <div className="overflow-x-auto">

                        {/* ----------------- TAB BOOKING ----------------- */}
                        {activeTab === "bookings" && (
                            <>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                                        <CalendarDays className="w-4 h-4 text-blue-600 dark:text-emerald-400" />
                                        <span>Pilih tanggal</span>
                                        <input
                                            type="date"
                                            value={selectedBookingDate}
                                            onChange={(event) => {
                                                if (event.target.value) setSelectedBookingDate(event.target.value);
                                            }}
                                            className="px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold focus:outline-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                                        <span>Filter status</span>
                                        <select
                                            value={bookingStatusFilter}
                                            onChange={(event) => setBookingStatusFilter(event.target.value)}
                                            className="px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold focus:outline-blue-500"
                                        >
                                            <option value="ALL">Semua status</option>
                                            <option value="PENDING_DP">Pending DP</option>
                                            <option value="BOOKED">DP diterima</option>
                                            <option value="BOOKED_PAID">Lunas (Paid)</option>
                                            <option value="REJECTED_CANCELLED">Rejected / Canceled</option>
                                        </select>
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={fetchBookings}
                                    disabled={loading}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                                    Refresh Data
                                </button>
                            </div>
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-black text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">No.</th>
                                    <th className="px-6 py-4">Nama & Kontak</th>
                                    <th className="px-6 py-4">Jadwal</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {filteredBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className={`px-6 py-8 text-center font-medium ${bookingsError ? "text-rose-600 dark:text-rose-400" : "text-slate-400"}`}>
                                            {bookingsError || "Tidak ada data booking ditemukan."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBookings.map((b, index) => (
                                        <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-xs">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <p className="font-extrabold text-slate-900 dark:text-white">{b.customer_name}</p>
                                                <p className="text-[11px] font-medium text-slate-500">{b.phone_number}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-xs">{new Date(b.booking_date).toLocaleDateString('id-ID')}</p>
                                                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-extrabold">{formatBookingTime(b.start_time, b.end_time)}</p>
                                            </td>
                                            <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              b.status === 'BOOKED_PAID' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                              b.status === 'BOOKED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                                  b.status === 'REJECTED' || b.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' :
                                      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                          }`}>
                            {b.status === 'BOOKED_PAID' ? 'LUNAS (PAID)' : b.status === 'BOOKED' ? 'DP DITERIMA' : b.status ? b.status.replace('_', ' ') : 'PENDING'}
                          </span>
                                            </td>
                                            <td className="px-6 py-4 flex justify-center items-center space-x-1.5">
                                                {b.status === 'PENDING_DP' && (
                                                    <button
                                                        onClick={() => handleVerifyManualPayment(b, 'DP')}
                                                        title="Verifikasi DP manual menjadi BOOKED"
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 dark:text-emerald-400 rounded-xl transition cursor-pointer text-[11px] font-black"
                                                    >
                                                        <BadgeCheck className="w-4 h-4" />
                                                        Verifikasi DP
                                                    </button>
                                                )}
                                                {b.status === 'BOOKED' && (
                                                    <button
                                                        onClick={() => handleVerifyManualPayment(b, 'SETTLEMENT')}
                                                        title="Verifikasi pelunasan manual menjadi LUNAS"
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:text-blue-400 rounded-xl transition cursor-pointer text-[11px] font-black"
                                                    >
                                                        <BadgeCheck className="w-4 h-4" />
                                                        Verifikasi Lunas
                                                    </button>
                                                )}
                                                {b.status !== 'BOOKED_PAID' && b.status !== 'REJECTED' && b.status !== 'CANCELLED' && (
                                                    <button onClick={() => handleUpdateBookingStatus(b.id, 'REJECTED')} title="Tolak / Batal" className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-xl transition cursor-pointer">
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                            </>
                        )}

                        {/* ----------------- TAB SLOT & JADWAL ----------------- */}
                        {activeTab === "schedule" && (
                            <>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                                        <CalendarDays className="w-4 h-4 text-blue-600 dark:text-emerald-400" />
                                        <span>Pilih tanggal</span>
                                        <input
                                            type="date"
                                            value={selectedBookingDate}
                                            onChange={(event) => {
                                                if (event.target.value) setSelectedBookingDate(event.target.value);
                                            }}
                                            className="px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold focus:outline-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={fetchScheduleBookings}
                                        disabled={loading}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                                        Refresh Jadwal
                                    </button>
                                </div>
                                {scheduleError ? (
                                    <p role="alert" className="p-6 text-center text-sm font-semibold text-rose-600 dark:text-rose-400">
                                        {scheduleError}
                                    </p>
                                ) : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                                    {scheduleSlots.map(({ label, hourBookings }) => {
                                        const hasPaidBooking = hourBookings.some((booking) => booking.status === "BOOKED_PAID");

                                        return (
                                            <section
                                                key={label}
                                                className={`rounded-2xl border-2 p-4 shadow-md ${
                                                    hasPaidBooking
                                                        ? "border-blue-500 bg-blue-100 shadow-blue-300/70 dark:border-blue-500 dark:bg-blue-950/70 dark:shadow-blue-950/50"
                                                        : hourBookings.length
                                                            ? "border-rose-500 bg-rose-100 shadow-rose-300/70 dark:border-rose-700 dark:bg-rose-950/60 dark:shadow-rose-950/50"
                                                            : "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{label} WIB</h3>
                                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                                                        hasPaidBooking
                                                            ? "bg-blue-600 text-white dark:bg-blue-500"
                                                            : hourBookings.length
                                                                ? "bg-rose-600 text-white dark:bg-rose-500"
                                                                : "bg-emerald-600 text-white dark:bg-emerald-600"
                                                    }`}>
                                                        {hasPaidBooking ? "Lunas" : hourBookings.length ? "Booked" : "Kosong"}
                                                    </span>
                                                </div>
                                                {hourBookings.length ? (
                                                    <div className="space-y-2">
                                                        {hourBookings.map((booking) => {
                                                            const isPaid = booking.status === "BOOKED_PAID";

                                                            return (
                                                                <div
                                                                    key={`${label}-${booking.id}`}
                                                                    className={`rounded-xl border px-3 py-2 shadow-sm ${
                                                                        isPaid
                                                                            ? "border-blue-800 bg-blue-700 text-white dark:border-blue-400 dark:bg-blue-600"
                                                                            : "border-rose-800 bg-rose-700 text-white dark:border-rose-400 dark:bg-rose-600"
                                                                    }`}
                                                                >
                                                                    <p className="font-extrabold text-xs">{booking.customer_name}</p>
                                                                    <p className="text-[11px] font-semibold text-white/90">{booking.phone_number}</p>
                                                                    <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-white">
                                                                        {isPaid ? "Booked & Paid" : "DP Diterima"}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Belum ada booking.</p>
                                                )}
                                            </section>
                                        );
                                    })}
                                </div>}
                            </>
                        )}

                        {/* ----------------- TAB PENGGUNA ----------------- */}
                        {activeTab === "users" && (
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-black text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">No.</th>
                                    <th className="px-6 py-4">Nama Lengkap</th>
                                    <th className="px-6 py-4">Kontak (No. HP / Email)</th>
                                    <th className="px-6 py-4">Peran (Role)</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-medium">Tidak ada data pengguna ditemukan.</td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u, index) => (
                                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-xs">{index + 1}</td>
                                            <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white">{u.name}</td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-xs">{u.phone_number || "-"}</p>
                                                <p className="text-[11px] text-slate-500">{u.email || "-"}</p>
                                            </td>
                                            <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              u.role === 'ADMIN' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}>
                            {u.role}
                          </span>
                                            </td>
                                            <td className="px-6 py-4 flex justify-center">
                                                <button onClick={() => handleDeleteUser(u.id, u.name)} disabled={u.role === 'ADMIN'} title={u.role === 'ADMIN' ? "Tidak bisa hapus Admin" : "Hapus Pengguna"} className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        )}

                    </div>
                </motion.div>
            )}
        </div>
    );
}