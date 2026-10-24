import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast"; // <-- IMPORT TOAST
import {
  X,
  User,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  KeyRound,
} from "lucide-react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function Login({ onClose, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState("user");
  const [userView, setUserView] = useState("login");

  const [userForm, setUserForm] = useState({ phone_number: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
  });
  const [forgotForm, setForgotForm] = useState({
    phone_number: "",
    otp: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [adminForm, setAdminForm] = useState({ email: "", password: "" });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Sedang memverifikasi...");

    try {
      const res = await axios.post(`${API_URL}/auth/login`, userForm);
      toast.success(res.data.message || "Login berhasil!", { id: toastId });

      if (res.data.token) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        localStorage.setItem("userToken", res.data.token);
        localStorage.setItem("userData", JSON.stringify(res.data.user));
      }

      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(res.data.user, "user");
        onClose();
      }, 800);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Nomor HP atau password salah.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleUserRegister = async (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setLoading(true);
    const toastId = toast.loading("Mendaftarkan akun...");

    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        name: registerForm.name,
        phone_number: registerForm.phone_number,
        password: registerForm.password,
      });

      toast.success(res.data.message || "Pendaftaran akun berhasil!", {
        id: toastId,
      });
      setTimeout(() => {
        setUserView("login");
        setUserForm({ phone_number: registerForm.phone_number, password: "" });
      }, 1000);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Gagal mendaftar. Silakan coba lagi.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleUserResetPassword = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(forgotForm.otp)) {
      toast.error("Masukkan OTP 6 digit yang dikirim melalui WhatsApp.");
      return;
    }
    if (forgotForm.newPassword !== forgotForm.confirmNewPassword) {
      toast.error("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }
    setLoading(true);
    const toastId = toast.loading("Mereset kata sandi...");

    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, {
        phone_number: forgotForm.phone_number,
        otp: forgotForm.otp,
        newPassword: forgotForm.newPassword,
      });

      toast.success(res.data.message || "Kata sandi berhasil diubah!", {
        id: toastId,
      });
      setTimeout(() => {
        setOtpSent(false);
        setUserView("login");
        setUserForm({ phone_number: forgotForm.phone_number, password: "" });
      }, 1000);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Gagal memperbarui kata sandi.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordResetOtp = async () => {
    if (!forgotForm.phone_number.trim()) {
      toast.error("Masukkan nomor HP terdaftar terlebih dahulu.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Mengirim OTP melalui WhatsApp...");
    try {
      const res = await axios.post(`${API_URL}/auth/request-password-reset-otp`, {
        phone_number: forgotForm.phone_number,
      });
      setOtpSent(true);
      toast.success(res.data.message || "Jika nomor terdaftar, OTP akan dikirim melalui WhatsApp.", {
        id: toastId,
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Gagal mengirim OTP. Silakan coba lagi.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Memverifikasi Admin...");

    try {
      const res = await axios.post(`${API_URL}/auth/admin-login`, adminForm);
      toast.success(res.data.message || "Login Admin berhasil!", {
        id: toastId,
      });

      if (res.data.token) {
        localStorage.removeItem("userToken");
        localStorage.removeItem("userData");
        localStorage.setItem("adminToken", res.data.token);
        localStorage.setItem("adminData", JSON.stringify(res.data.admin));
      }

      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(res.data.admin, "admin");
        onClose();
      }, 800);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Akses ditolak. Email atau password salah.";
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 mb-3 border border-emerald-500/20">
            {activeTab === "user" ? (
              userView === "register" ? (
                <UserPlus className="w-6 h-6" />
              ) : userView === "forgot" ? (
                <KeyRound className="w-6 h-6" />
              ) : (
                <LogIn className="w-6 h-6" />
              )
            ) : (
              <LogIn className="w-6 h-6" />
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {activeTab === "user"
              ? userView === "register"
                ? "Buat Akun Baru"
                : userView === "forgot"
                  ? "Reset Kata Sandi"
                  : "Selamat Datang"
              : "Selamat Datang"}
          </h2>
        </div>

        <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("user");
              setUserView("login");
            }}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl font-extrabold text-xs transition-all duration-200 cursor-pointer ${activeTab === "user" ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <User className="w-4 h-4 text-blue-500 dark:text-emerald-400" />
            <span>Pengunjung</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setUserView("login");
            }}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl font-extrabold text-xs transition-all duration-200 cursor-pointer ${activeTab === "admin" ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Administrator</span>
          </button>
        </div>

        {/* NOTIFIKASI DALAM MODAL DIHAPUS, DIGANTI TOAST */}
        {activeTab === "user" && (
          <>
            {userView === "login" && (
              <form onSubmit={handleUserLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    No. HP
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      value={userForm.phone_number}
                      onChange={(e) =>
                        setUserForm({
                          ...userForm,
                          phone_number: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotForm((previous) => ({
                          ...previous,
                          phone_number: userForm.phone_number,
                          otp: "",
                        }));
                        setOtpSent(false);
                        setUserView("forgot");
                      }}
                      className="text-[10px] font-bold text-blue-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Lupa Kata Sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={userForm.password}
                      onChange={(e) =>
                        setUserForm({ ...userForm, password: e.target.value })
                      }
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-black py-3.5 px-4 rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-widest disabled:opacity-60 cursor-pointer mt-2"
                >
                  {loading ? "Memproses..." : "Masuk Sebagai Pengunjung"}
                </button>
              </form>
            )}

            {userView === "register" && (
              <form onSubmit={handleUserRegister} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Nama
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Nama lengkap"
                      value={registerForm.name}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-emerald-500 text-xs font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    No. HP
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      value={registerForm.phone_number}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          phone_number: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-emerald-500 text-xs font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Min. 6 karakter"
                      value={registerForm.password}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          password: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-emerald-500 text-xs font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Ulangi Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Ulangi sandi"
                      value={registerForm.confirmPassword}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-emerald-500 text-xs font-medium"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-4 rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-widest disabled:opacity-60 cursor-pointer mt-2"
                >
                  {loading ? "Mendaftarkan..." : "Daftar Akun Baru"}
                </button>
              </form>
            )}

            {userView === "forgot" && (
              <form onSubmit={handleUserResetPassword} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    No. HP Terdaftar
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      value={forgotForm.phone_number}
                      onChange={(e) => {
                        setOtpSent(false);
                        setForgotForm({
                          ...forgotForm,
                          phone_number: e.target.value,
                          otp: "",
                        });
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRequestPasswordResetOtp}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 px-4 rounded-xl transition duration-200 text-xs uppercase tracking-widest disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "Mengirim OTP..." : otpSent ? "Kirim Ulang OTP WhatsApp" : "Kirim OTP WhatsApp"}
                </button>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Kode OTP WhatsApp
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    placeholder="Masukkan 6 digit OTP"
                    value={forgotForm.otp}
                    onChange={(e) =>
                      setForgotForm({
                        ...forgotForm,
                        otp: e.target.value.replace(/\D/g, "").slice(0, 6),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-bold tracking-[0.3em]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      maxLength={128}
                      placeholder="Min. 6 karakter"
                      value={forgotForm.newPassword}
                      onChange={(e) =>
                        setForgotForm({
                          ...forgotForm,
                          newPassword: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Ulangi Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      maxLength={128}
                      placeholder="Ulangi sandi baru"
                      value={forgotForm.confirmNewPassword}
                      onChange={(e) =>
                        setForgotForm({
                          ...forgotForm,
                          confirmNewPassword: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || !otpSent}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-4 rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-widest disabled:opacity-60 cursor-pointer mt-2"
                >
                  {loading ? "Mereset..." : "Reset Kata Sandi"}
                </button>
              </form>
            )}

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
              {userView === "login" && (
                <p>
                  Belum punya akun?{" "}
                  <button
                    type="button"
                    onClick={() => setUserView("register")}
                    className="font-extrabold text-blue-600 dark:text-emerald-400 hover:underline cursor-pointer ml-1"
                  >
                    Daftar Sekarang
                  </button>
                </p>
              )}
              {(userView === "register" || userView === "forgot") && (
                <p>
                  Sudah punya akun?{" "}
                  <button
                    type="button"
                    onClick={() => setUserView("login")}
                    className="font-extrabold text-blue-600 dark:text-emerald-400 hover:underline cursor-pointer ml-1"
                  >
                    Masuk di sini
                  </button>
                </p>
              )}
            </div>
          </>
        )}

        {activeTab === "admin" && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Email Admin
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="admin@cikajangsport.com"
                  value={adminForm.email}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, email: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-amber-500 text-xs font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={adminForm.password}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, password: e.target.value })
                  }
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-amber-500 text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 px-4 rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-widest disabled:opacity-60 cursor-pointer mt-2 border border-slate-700"
            >
              {loading ? "Verifikasi..." : "Masuk Sebagai Admin"}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
