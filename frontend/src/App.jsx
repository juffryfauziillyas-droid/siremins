import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import AdminDashboard from "./components/AdminDashboard";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import BookingSection from "./components/BookingSection";
import ContactSection from "./components/ContactSection";
import Login from "./components/Login";
import Account from "./components/Account";
import MyBookingsModal from "./components/MyBookings";
import Logout from "./components/Logout";
import Footer from "./components/Footer";

const API_URL = "http://localhost:5000/api";

axios.interceptors.request.use((config) => {
  const isAdminRequest = String(config.url || "").includes("/api/admin/");
  const token = localStorage.getItem(isAdminRequest ? "adminToken" : "userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function App() {
    // === TEMPATKAN KODE DI SINI ===
    const getTomorrowLocalDateString = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [selectedDate, setSelectedDate] = useState(getTomorrowLocalDateString());
    // ==============================
  const [bookedSlots, setBookedSlots] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: "",
    phone_number: "",
    start_time: "",
    end_time: "",
  });
  const [duration, setDuration] = useState(1);

  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("siremins-theme");
    if (savedTheme) return savedTheme === "dark";
    return document.documentElement.classList.contains("dark");
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("userData");
    const savedAdmin = localStorage.getItem("adminData");
    if (savedUser && localStorage.getItem("userToken")) return JSON.parse(savedUser);
    if (savedAdmin && localStorage.getItem("adminToken")) return JSON.parse(savedAdmin);
    return null;
  });

  const [showBooking, setShowBooking] = useState(() =>
    currentUser?.role === "user" && sessionStorage.getItem("siremins-active-modal") === "booking"
  );
  const [showLogin, setShowLogin] = useState(false);
  const [showAccount, setShowAccount] = useState(() =>
    currentUser?.role === "user" && sessionStorage.getItem("siremins-active-modal") === "account"
  );
  const [showMyBookings, setShowMyBookings] = useState(() =>
    currentUser?.role === "user" && sessionStorage.getItem("siremins-active-modal") === "my-bookings"
  );
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const activeModal = showBooking
      ? "booking"
      : showMyBookings
        ? "my-bookings"
        : showAccount
          ? "account"
          : null;

    if (activeModal && currentUser?.role === "user") {
      sessionStorage.setItem("siremins-active-modal", activeModal);
    } else {
      sessionStorage.removeItem("siremins-active-modal");
    }
  }, [currentUser, showBooking, showMyBookings, showAccount]);

  const updateBookingTime = (startTime, requestedDuration) => {
    const startHour = parseInt(startTime.split(":")[0], 10);
    const nextDuration = Math.min(requestedDuration, 24 - startHour);

    setDuration(nextDuration);
    setFormData((prev) => ({
      ...prev,
      start_time: startTime,
      end_time: `${startHour + nextDuration}:00`,
    }));
  };

  const timeSlots = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
    "23:00",
  ];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("siremins-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("siremins-theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    if (!showBooking) return undefined;

    let isActive = true;
    const fetchBookedSlots = async () => {
      try {
        const response = await axios.get(`${API_URL}/bookings`, {
          params: { date: selectedDate },
        });
        if (isActive) setBookedSlots(response.data);
      } catch (error) {
        if (isActive) console.error("Gagal mengambil data jadwal:", error);
      }
    };

    fetchBookedSlots();
    const intervalId = window.setInterval(fetchBookedSlots, 10000);
    window.addEventListener("focus", fetchBookedSlots);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", fetchBookedSlots);
    };
  }, [selectedDate, showBooking]);

  useEffect(() => {
    if (
      showBooking ||
      showLogin ||
      showAccount ||
      showMyBookings ||
      showLogout
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [
    selectedDate,
    showBooking,
    showLogin,
    showAccount,
    showMyBookings,
    showLogout,
  ]);

  const handleOpenBooking = () => {
    const token = localStorage.getItem("userToken");
    if (!token && !currentUser) {
      setShowLogin(true);
    } else {
      if (currentUser) {
        setFormData((prev) => ({
          ...prev,
          customer_name: currentUser.name || prev.customer_name,
          phone_number: currentUser.phone_number || prev.phone_number,
        }));
      }
      setShowBooking(true);
    }
  };

  const handleLoginSuccess = (userData, role) => {
    const userWithRole = { ...userData, role };
    setCurrentUser(userWithRole);
    setShowLogin(false);

    if (role === "user") {
      localStorage.setItem("userData", JSON.stringify(userWithRole));
      setFormData((prev) => ({
        ...prev,
        customer_name: userData.name || prev.customer_name,
        phone_number: userData.phone_number || prev.phone_number,
      }));
      setShowBooking(true);
    } else if (role === "admin") {
      localStorage.setItem("adminData", JSON.stringify(userWithRole));
    }
  };

  const handleUpdateProfileSuccess = (updatedUser) => {
    const newUserData = { ...currentUser, ...updatedUser };
    setCurrentUser(newUserData);
    localStorage.setItem("userData", JSON.stringify(newUserData));
  };

  const handleConfirmLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    setCurrentUser(null);
    setShowLogout(false);
    toast.success("Berhasil keluar dari akun.");
  };

    const getSlotStatus = (time) => {
        const match = bookedSlots.find((slot) => {
            const bStart = parseInt(slot.start_time.split(":")[0], 10);
            let bEnd = parseInt(slot.end_time.split(":")[0], 10);
            if (bEnd === 0) bEnd = 24;

            const currentHour = parseInt(time.split(":")[0], 10);
            return currentHour >= bStart && currentHour < bEnd;
        });

        return match ? match.status : "AVAILABLE";
    };

  const handleBookingConfirmed = async () => {
    const updatedData = await axios.get(
      `${API_URL}/bookings?date=${selectedDate}`,
    );
    setBookedSlots(updatedData.data);
    setFormData((prev) => ({ ...prev, start_time: "", end_time: "" }));
    setDuration(1);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white dark:selection:bg-emerald-400 dark:selection:text-slate-950 transition-colors duration-300">
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            className:
              "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl text-xs font-black tracking-wide",
            success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
            error: { iconTheme: { primary: "#f43f5e", secondary: "#fff" } },
          }}
        />

        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onLoginClick={() => setShowLogin(true)}
          currentUser={currentUser}
          isAdmin={currentUser?.role === "admin"}
          onOpenAccount={() => setShowAccount(true)}
          onOpenMyBookings={() => setShowMyBookings(true)}
          onOpenLogout={() => setShowLogout(true)}
        />

        {/* RENDER KONDISIONAL UTAMA */}
        {currentUser?.role === "admin" ? (
          // Tambahkan prop onLogoutClick agar Admin tetap bisa logout dari dalam dashboard
          <AdminDashboard
            currentUser={currentUser}
            onLogoutClick={() => setShowLogout(true)}
          />
        ) : (
          <>
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <Hero onBookingClick={handleOpenBooking} />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
            >
              <Features onSelectMiniSoccer={handleOpenBooking} />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeInUp}
            >
              <ContactSection />
            </motion.div>
          </>
        )}

        {/* ... (BIARKAN SEMUA MODAL AnimatePresence TETAP DI SINI) ... */}
        <AnimatePresence>
          {showBooking && (
            <BookingSection
              onClose={() => setShowBooking(false)}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              timeSlots={timeSlots}
              getSlotStatus={getSlotStatus}
              formData={formData}
              setFormData={setFormData}
              onUpdateBookingTime={updateBookingTime}
              onBookingConfirmed={handleBookingConfirmed}
              duration={duration}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showLogin && (
              <Login
                  onClose={() => setShowLogin(false)}
                  onLoginSuccess={handleLoginSuccess}
              />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showAccount && (
              <Account
                  currentUser={currentUser}
                  onClose={() => setShowAccount(false)}
                  onUpdateSuccess={handleUpdateProfileSuccess}
              />
          )}
        </AnimatePresence>
          <AnimatePresence>
              {showMyBookings && (
                  <MyBookingsModal
                      currentUser={currentUser}
                      onClose={() => setShowMyBookings(false)}
                  />
              )}
          </AnimatePresence>
        <AnimatePresence>
          {showLogout && (
            <Logout
              onClose={() => setShowLogout(false)}
              onConfirm={handleConfirmLogout}
            />
          )}
        </AnimatePresence>

        {/* TAMPILKAN FOOTER HANYA JIKA BUKAN ADMIN */}
        {currentUser?.role !== "admin" && <Footer />}
      </div>
    );
}
