import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, User, Phone, Mail, Shield, Save } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = "http://localhost:5000/api";

export default function Account({ currentUser, onClose, onUpdateSuccess }) {
  const [name, setName] = useState(currentUser?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
    }
  }, [currentUser]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Memperbarui profil...");

    try {
      const response = await axios.put(`${API_URL}/auth/update-profile`, {
        id: currentUser.id,
        name,
        currentPassword,
        newPassword,
      });

      toast.success(response.data.message, { id: toastId });
      if (onUpdateSuccess) {
        onUpdateSuccess(response.data.user);
      }
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Gagal memperbarui profil.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto"
      >
        {/* Latar belakang untuk menutup modal saat diklik */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="relative bg-white dark:bg-slate-950 w-full max-w-md rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 my-auto select-none"
        >
          {/* TOMBOL X MERAH */}
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
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Informasi Akun
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                Kelola profil dan keamanan akun Anda
              </p>
            </div>
          </div>

          {/* FORM DATA AKUN */}
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-blue-500 dark:focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Nomor WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                    type="tel"
                    disabled
                    value={currentUser?.phone_number || "-"}
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-xl text-slate-400 text-xs font-bold cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                    type="email"
                    disabled
                    value={currentUser?.email || "-"}
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-xl text-slate-400 text-xs font-bold cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-3">
                Ubah Kata Sandi (Opsional)
              </p>
              <div className="space-y-3">
                <input
                    type="password"
                    placeholder="Kata sandi saat ini"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-all"
                />
                <input
                    type="password"
                    placeholder="Kata sandi baru"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center bg-blue-600 hover:bg-blue-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
            </button>
          </form>
        </motion.div>
      </motion.div>
  );
}