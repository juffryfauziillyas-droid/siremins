import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Users,
    CalendarDays,
    CheckCircle2,
    XCircle,
    Trash2,
    Search,
    RefreshCw,
    LogOut
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function AdminDashboard({ currentUser, onLogoutClick }) {
    const [activeTab, setActiveTab] = useState("bookings"); // 'bookings' atau 'users'
    const [bookings, setBookings] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Mengambil data Booking
    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/admin/bookings`);
            setBookings(res.data);
        } catch (error) {
            toast.error("Gagal memuat data booking.");
        } finally {
            setLoading(false);
        }
    };

    // Mengambil data User
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/admin/users`);
            setUsers(res.data);
        } catch (error) {
            toast.error("Gagal memuat data pengguna.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "bookings") fetchBookings();
        if (activeTab === "users") fetchUsers();
    }, [activeTab]);

    // Fungsi mengubah status booking (Terima/Tolak)
    const handleUpdateBookingStatus = async (id, newStatus) => {
        const toastId = toast.loading("Memperbarui status...");
        try {
            await axios.put(`${API_URL}/admin/bookings/${id}`, { status: newStatus });
            toast.success(`Status berhasil diubah menjadi ${newStatus}`, { id: toastId });
            fetchBookings(); // Muat ulang data
        } catch (error) {
            toast.error("Gagal memperbarui status.", { id: toastId });
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

    // Filter pencarian
    const filteredBookings = bookings.filter(b =>
        b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.phone_number?.includes(searchTerm)
    );

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone_number?.includes(searchTerm)
    );

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
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 dark:bg-slate-950/50 text-xs uppercase font-black text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Nama & Kontak</th>
                                    <th className="px-6 py-4">Jadwal</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {filteredBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-medium">Tidak ada data booking ditemukan.</td>
                                    </tr>
                                ) : (
                                    filteredBookings.map((b) => (
                                        <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-xs">#{b.id}</td>
                                            <td className="px-6 py-4">
                                                <p className="font-extrabold text-slate-900 dark:text-white">{b.customer_name}</p>
                                                <p className="text-[11px] font-medium text-slate-500">{b.phone_number}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-xs">{new Date(b.booking_date).toLocaleDateString('id-ID')}</p>
                                                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-extrabold">{b.start_time} - {b.end_time} WIB</p>
                                            </td>
                                            <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              b.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                                  b.status === 'REJECTED' || b.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' :
                                      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                          }`}>
                            {b.status || 'PENDING'}
                          </span>
                                            </td>
                                            <td className="px-6 py-4 flex justify-center space-x-2">
                                                <button onClick={() => handleUpdateBookingStatus(b.id, 'APPROVED')} title="Terima" className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 dark:text-emerald-400 rounded-xl transition">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleUpdateBookingStatus(b.id, 'REJECTED')} title="Tolak / Batal" className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-xl transition">
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        )}

                        {/* ----------------- TAB PENGGUNA ----------------- */}
                        {activeTab === "users" && (
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 dark:bg-slate-950/50 text-xs uppercase font-black text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
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
                                    filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-xs">#{u.id}</td>
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