import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Ticket,
} from "lucide-react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function MyBookingsModal({ currentUser, onClose }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // Format tanggal Indonesia
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

  // Badge Status Warna
  const renderStatusBadge = (status) => {
    const statusUpper = (status || "PENDING").toUpperCase();

    if (
      statusUpper === "APPROVED" ||
      statusUpper === "SUCCESS" ||
      statusUpper === "LUNAS"
    ) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          <span>DIKONFIRMASI</span>
        </span>
      );
    }

    if (
      statusUpper === "CANCELLED" ||
      statusUpper === "REJECTED" ||
      statusUpper === "BATAL"
    ) {
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
        <span>MENUNGGU</span>
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative bg-white dark:bg-slate-950 w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 my-auto select-none"
      >
        {/* TOMBOL CLOSE */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-emerald-400 border border-blue-500/20">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Booking Saya
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              Riwayat reservasi lapang Cikajang Sport Center
            </p>
          </div>
        </div>

        {/* REFRESH BUTTON */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Total Booking:{" "}
            <strong className="text-slate-900 dark:text-white">
              {bookings.length}
            </strong>
          </span>
          <button
            type="button"
            onClick={fetchMyBookings}
            disabled={loading}
            className="flex items-center space-x-1.5 text-xs font-bold text-blue-600 dark:text-emerald-400 hover:underline cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Muat Ulang</span>
          </button>
        </div>

        {/* CONTENT DAFTAR BOOKING */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold">
            Memuat jadwal bookingan Anda...
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs text-center font-semibold">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-slate-700 dark:text-slate-300 font-extrabold text-sm">
              Belum Ada Bookingan
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Anda belum melakukan pemesanan jadwal arena lapangan.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {bookings.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 flex flex-col space-y-2 hover:border-blue-500/50 dark:hover:border-emerald-500/50 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-emerald-400">
                      Mini Soccer Arena
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(item.booking_date)}</span>
                    </h4>
                  </div>
                  {renderStatusBadge(item.status)}
                </div>

                <div className="flex items-center space-x-4 text-xs font-semibold text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {item.start_time} - {item.end_time} WIB
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
