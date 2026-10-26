import { motion } from "framer-motion";
import { LogOut, AlertTriangle, X } from "lucide-react";

export default function Logout({ onClose, onConfirm }) {
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
        className="relative bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl z-10 my-auto text-center select-none"
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 mb-4 border border-rose-500/20">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          Konfirmasi Keluar
        </h3>

        <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 font-medium leading-relaxed">
          Apakah Anda benar-benar yakin ingin keluar dari akun Anda?
        </p>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md transition cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Ya, Keluar</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
