import { motion } from "framer-motion";
import {
  Clock,
  User,
  Phone,
  Layers,
  X,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function BookingSection({
  onClose,
  selectedDate,
  setSelectedDate,
  timeSlots,
  getSlotStatus,
  formData,
  setFormData,
  onUpdateBookingTime,
  duration,
  handleBooking, // <-- 'message' dihapus
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative bg-white dark:bg-slate-950 w-full max-w-5xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 my-auto max-h-[90vh] overflow-y-auto select-none"
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white transition-all duration-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-left mb-6 border-b border-slate-100 dark:border-slate-800/80 pb-4 pr-10">
          <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-emerald-400 text-xs font-extrabold uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Formulir Reservasi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Mulai Reservasi Lapangan
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Tentukan tanggal bermain dan pilih slot jam operasional yang
            tersedia (08:00 - 24:00 WIB).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* BAGIAN KIRI (KALENDER & SLOT WAKTU) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 gap-3">
              <span className="text-xs font-black flex items-center text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Calendar className="w-4 h-4 mr-2 text-blue-600 dark:text-emerald-400" />{" "}
                Tanggal Bermain:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-blue-500 font-bold cursor-pointer shadow-xs"
              />
            </div>

            <div className="flex items-center justify-around text-[11px] font-bold bg-slate-50 dark:bg-slate-900/40 py-3 rounded-2xl text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                <span>Kosong</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full"></span>
                <span>Menunggu DP</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                <span>Terpesan</span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {timeSlots.map((time, index) => {
                const status = getSlotStatus(time);
                const isSelected = formData.start_time === time;
                let btnClass =
                  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-slate-950";
                if (status === "PENDING_DP")
                  btnClass =
                    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40 pointer-events-none opacity-60";
                if (status === "BOOKED")
                  btnClass =
                    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40 pointer-events-none opacity-60";
                if (isSelected)
                  btnClass =
                    "bg-blue-600 text-white border-blue-600 dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-500 font-black shadow-md";
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onUpdateBookingTime(time, duration)}
                    className={`p-3 text-center rounded-xl border font-extrabold text-xs transition-all duration-200 cursor-pointer ${btnClass}`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BAGIAN KANAN (FORM) */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/60 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            {/* BLOK NOTIFIKASI ERROR/SUKSES LAMA TELAH DIHAPUS DI SINI */}

            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Nama Pemesan / Tim FC
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Garudano FC"
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_name: e.target.value,
                      })
                    }
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Nomor WhatsApp Aktif
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number: e.target.value })
                    }
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Durasi Bermain
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={duration}
                    onChange={(e) =>
                      onUpdateBookingTime(
                        formData.start_time,
                        parseInt(e.target.value, 10),
                      )
                    }
                    disabled={!formData.start_time}
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-bold disabled:bg-slate-100 disabled:dark:bg-slate-900 disabled:text-slate-400 cursor-pointer"
                  >
                    <option value={1}>1 Jam</option>
                    <option value={2}>2 Jam</option>
                    <option value={3}>3 Jam</option>
                    <option value={4}>4 Jam</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="text"
                    placeholder="--"
                    readOnly
                    value={formData.start_time}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center rounded-xl font-black text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="text"
                    placeholder="--"
                    readOnly
                    value={formData.end_time}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center rounded-xl font-black text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!formData.start_time}
                className="w-full bg-slate-900 hover:bg-blue-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-black py-3.5 px-4 rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-widest disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-600 cursor-pointer mt-2"
              >
                Kunci Jadwal & Lanjut Pembayaran
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
