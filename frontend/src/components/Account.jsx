import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  User,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  KeyRound,
} from "lucide-react";
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
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (showChangePassword) {
      if (!currentPassword) {
        setMessage({ type: "error", text: "Masukkan kata sandi saat ini." });
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setMessage({
          type: "error",
          text: "Konfirmasi kata sandi baru tidak cocok.",
        });
        return;
      }
      if (newPassword.length < 6) {
        setMessage({
          type: "error",
          text: "Kata sandi baru minimal 6 karakter.",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        id: currentUser.id,
        name,
        currentPassword: showChangePassword ? currentPassword : "",
        newPassword: showChangePassword ? newPassword : "",
      };

      const res = await axios.put(`${API_URL}/auth/update-profile`, payload);

      setMessage({
        type: "success",
        text: res.data.message || "Profil berhasil diperbarui!",
      });

      if (onUpdateSuccess) {
        onUpdateSuccess(res.data.user);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Gagal memperbarui profil.";
      setMessage({ type: "error", text: errorMsg });
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

        {/* HEADER */}
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

        {/* PESAN NOTIFIKASI */}
        {message.text && (
          <div
            className={`p-3.5 rounded-xl mb-4 text-xs font-semibold flex items-center space-x-2.5 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NOMOR WA / HP (READ ONLY) */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Nomor WhatsApp / No. HP (Tidak dapat diubah)
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

          {/* NAMA PENGGUNJUNG */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="Masukkan nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
              />
            </div>
          </div>

          {/* TOGGLE UBAT KATA SANDI */}
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

          {/* FORM GANTI KATA SANDI */}
          {showChangePassword && (
            <div className="space-y-3 pt-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan kata sandi lama"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Ulangi kata sandi baru"
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
