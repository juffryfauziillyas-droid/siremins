import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast"; // <-- IMPORT TOAST
import { X, User, Phone, Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function Account({ currentUser, onClose, onUpdateSuccess }) {
  const [name, setName] = useState(currentUser?.name || "");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (showChangePassword) {
      if (!currentPassword) return toast.error("Masukkan kata sandi saat ini.");
      if (newPassword !== confirmNewPassword)
        return toast.error("Konfirmasi sandi baru tidak cocok.");
      if (newPassword.length < 6)
        return toast.error("Sandi baru minimal 6 karakter.");
    }

    setLoading(true);
    const toastId = toast.loading("Menyimpan profil...");

    try {
      const payload = {
        id: currentUser.id,
        name,
        currentPassword: showChangePassword ? currentPassword : "",
        newPassword: showChangePassword ? newPassword : "",
      };

      const res = await axios.put(`${API_URL}/auth/update-profile`, payload);
      toast.success(res.data.message || "Profil berhasil diperbarui!", {
        id: toastId,
      });

      if (onUpdateSuccess) onUpdateSuccess(res.data.user);

      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Gagal memperbarui profil.";
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
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative bg-white dark:bg-slate-950 w-full max-w-md rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 my-auto select-none"
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-emerald-400 mb-3 border border-blue-500/20">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Info & Ubah Akun
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
            Perbarui nama atau kata sandi akun Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              No. HP (Read-Only)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                disabled
                value={currentUser?.phone_number || "-"}
                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold cursor-not-allowed"
              />
            </div>
          </div>
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
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
              />
            </div>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="flex items-center space-x-2 text-xs font-extrabold text-blue-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {showChangePassword
                  ? "Batal Ganti Kata Sandi"
                  : "Ingin Ganti Kata Sandi?"}
              </span>
            </button>
          </div>
          {showChangePassword && (
            <div className="space-y-3 pt-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Sandi Lama
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Konfirmasi Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-black py-3.5 px-4 rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-widest disabled:opacity-60 cursor-pointer mt-4"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
