import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import BookingSection from "./components/BookingSection";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";

const API_URL = "http://localhost:5000/api";

export default function App() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [bookedSlots, setBookedSlots] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: "",
    phone_number: "",
    start_time: "",
    end_time: "",
  });
  const [duration, setDuration] = useState(1);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("siremins-theme");
    if (savedTheme) return savedTheme === "dark";
    return document.documentElement.classList.contains("dark");
  });

  const [showBooking, setShowBooking] = useState(false);

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
    if (showBooking) {
      axios
        .get(`${API_URL}/bookings?date=${selectedDate}`)
        .then((res) => setBookedSlots(res.data))
        .catch((err) => console.error("Gagal mengambil data jadwal:", err));

      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedDate, showBooking]);

  const getSlotStatus = (time) => {
    const match = bookedSlots.find((slot) => {
      const bStart = parseInt(slot.start_time.split(":")[0], 10);
      const bEnd = parseInt(slot.end_time.split(":")[0], 10);
      const currentHour = parseInt(time.split(":")[0], 10);
      return currentHour >= bStart && currentHour < bEnd;
    });
    return match ? match.status : "AVAILABLE";
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      const response = await axios.post(`${API_URL}/bookings`, {
        ...formData,
        booking_date: selectedDate,
      });

      setMessage({ type: "success", text: response.data.message });
      setFormData({
        customer_name: "",
        phone_number: "",
        start_time: "",
        end_time: "",
      });
      setDuration(1);

      const updatedData = await axios.get(
        `${API_URL}/bookings?date=${selectedDate}`,
      );
      setBookedSlots(updatedData.data);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        "Terjadi kesalahan pada sistem backend.";
      setMessage({ type: "error", text: errorMsg });
    }
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
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <Hero onBookingClick={() => setShowBooking(true)} />
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
      >
        <Features onSelectMiniSoccer={() => setShowBooking(true)} />
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={fadeInUp}
      >
        <ContactSection />
      </motion.div>

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
            duration={duration}
            message={message}
            handleBooking={handleBooking}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
