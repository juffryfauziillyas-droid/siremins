import { useState } from "react";
import { motion } from "framer-motion";
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
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function Login({ onClose, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState("user"); // 'user' atau 'admin'
  const [userView, setUserView] = useState("login"); // 'login', 'register', atau 'forgot'

  // State Form Login User
  const [userForm, setUserForm] = useState({
    phone_number: "",
    password: "",
  });

  // State Form Register User
  const [registerForm, setRegisterForm] = useState({
    name: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
  });

  // State Form Reset Password User
  const [forgotForm, setForgotForm] = useState({
    phone_number: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  // State Form Admin
  const [adminForm, setAdminForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Handle Login Pengunjung
  const handleUserLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/login`, userForm);
      setMessage({
        type: "success",
        text: res.data.message || "Login Pengunjung berhasil!",
      });

      if (res.data.token) {
        localStorage.setItem("userToken", res.data.token);
        localStorage.setItem("userData", JSON.stringify(res.data.user));
      }

      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(res.data.user, "user");
        onClose();
      }, 1200);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Gagal masuk. Periksa kembali Nomor HP dan password Anda.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Pengunjung
  const handleUserRegister = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (registerForm.password !== registerForm.confirmPassword) {
      setMessage({
        type: "error",
        text: "Konfirmasi kata sandi tidak cocok.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        name: registerForm.name,
        phone_number: registerForm.phone_number,
        password: registerForm.password,
      });

      setMessage({
        type: "success",
        text: res.data.message || "Pendaftaran akun berhasil! Silakan masuk.",
      });

      setTimeout(() => {
        setUserView("login");
        setMessage({ type: "", text: "" });
        setUserForm({
          phone_number: registerForm.phone_number,
          password: "",
        });
      }, 1500);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Gagal mendaftar. Silakan coba lagi.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password Pengunjung
  const handleUserResetPassword = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (forgotForm.newPassword !== forgotForm.confirmNewPassword) {
      setMessage({
        type: "error",
        text: "Konfirmasi kata sandi baru tidak cocok.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, {
        phone_number: forgotForm.phone_number,
        newPassword: forgotForm.newPassword,
      });

      setMessage({
        type: "success",
        text: res.data.message || "Kata sandi berhasil diubah! Silakan masuk.",
      });

      setTimeout(() => {
        setUserView("login");
        setMessage({ type: "", text: "" });
        setUserForm({
          phone_number: forgotForm.phone_number,
          password: "",
        });
      }, 1500);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Gagal memperbarui kata sandi. Periksa nomor HP Anda.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Handle Login Admin
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/admin-login`, adminForm);
      setMessage({
        type: "success",
        text: res.data.message || "Login Admin berhasil! Mengalihkan...",
      });

      if (res.data.token) {
        localStorage.setItem("adminToken", res.data.token);
        localStorage.setItem("adminData", JSON.stringify(res.data.admin));
      }

      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(res.data.admin, "admin");
        onClose();
      }, 1200);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Akses Admin ditolak. Email atau password salah.";
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
          className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER MODAL */}
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
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
            {activeTab === "user"
              ? userView === "register"
                ? "Lengkapi data diri Anda untuk pendaftaran"
                : userView === "forgot"
                  ? "Masukkan No. HP dan kata sandi baru Anda"
                  : "Silakan pilih jenis akun untuk melanjutkan"
              : "Silakan pilih jenis akun untuk melanjutkan"}
          </p>
        </div>

        {/* TAB NAVIGATION (PENGUNJUNG / ADMIN) */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("user");
              setUserView("login");
              setMessage({ type: "", text: "" });
            }}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl font-extrabold text-xs transition-all duration-200 cursor-pointer ${
              activeTab === "user"
                ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <User className="w-4 h-4 text-blue-500 dark:text-emerald-400" />
            <span>Pengunjung</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setUserView("login");
              setMessage({ type: "", text: "" });
            }}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl font-extrabold text-xs transition-all duration-200 cursor-pointer ${
              activeTab === "admin"
                ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Administrator</span>
          </button>
        </div>

        {/* NOTIFIKASI PESAN */}
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

        {/* FORM PENGUNJUNG */}
        {activeTab === "user" && (
          <>
            {userView === "login" && (
              /* 1. FORM LOGIN PENGUNJUNG */
              <form onSubmit={handleUserLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Nomor WhatsApp / No. HP
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
                      Kata Sandi (Password)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setUserView("forgot");
                        setMessage({ type: "", text: "" });
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
              /* 2. FORM REGISTRASI PENGUNJUNG */
              <form onSubmit={handleUserRegister} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama lengkap"
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
                    Nomor WhatsApp / No. HP
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
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Minimal 6 karakter"
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
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Ulangi kata sandi"
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
              /* 3. FORM RESET PASSWORD PENGUNJUNG */
              <form onSubmit={handleUserResetPassword} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Nomor WhatsApp / No. HP Terdaftar
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      value={forgotForm.phone_number}
                      onChange={(e) =>
                        setForgotForm({
                          ...forgotForm,
                          phone_number: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
                    />
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
                      required
                      placeholder="Minimal 6 karakter"
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
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Ulangi kata sandi baru"
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
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-4 rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-widest disabled:opacity-60 cursor-pointer mt-2"
                >
                  {loading ? "Mereset..." : "Reset Kata Sandi"}
                </button>
              </form>
            )}

            {/* NAVIGASI BOTTOM FOOTER */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
              {userView === "login" && (
                <p>
                  Belum memiliki akun?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setUserView("register");
                      setMessage({ type: "", text: "" });
                    }}
                    className="font-extrabold text-blue-600 dark:text-emerald-400 hover:underline cursor-pointer ml-1"
                  >
                    Daftar Sekarang
                  </button>
                </p>
              )}

              {(userView === "register" || userView === "forgot") && (
                <p>
                  Sudah memiliki akun?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setUserView("login");
                      setMessage({ type: "", text: "" });
                    }}
                    className="font-extrabold text-blue-600 dark:text-emerald-400 hover:underline cursor-pointer ml-1"
                  >
                    Masuk di sini
                  </button>
                </p>
              )}
            </div>
          </>
        )}

        {/* FORM ADMIN */}
        {activeTab === "admin" && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Email Administrator
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
                Password Admin
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
              {loading ? "Verifikasi..." : "Masuk Sebagai Administrator"}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
