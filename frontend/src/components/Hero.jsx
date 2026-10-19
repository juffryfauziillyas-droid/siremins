import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ArrowRight,
  Activity,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Hero({ onBookingClick }) {
  // DAFTAR FOTO YANG DITAMPILKAN BERGANTIAN
  const heroImages = [
    "/images/mini-soccer.jpg",
    "/images/gym.jpg",
    "/images/badminton.jpg",
    "/images/pingpong.jpg",
    "/images/senam.jpg",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // AUTO-SLIDE SETIAP 5 DETIK
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
  };

  const handlePrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + heroImages.length) % heroImages.length,
    );
  };

  return (
    <section
      id="hero"
      className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans"
    >
      {/* BANNER UTAMA  */}
      <div className="relative w-full overflow-hidden bg-slate-950 shadow-2xl min-h-[460px] sm:min-h-[510px] flex flex-col justify-between p-5 sm:p-8 lg:p-10">
        {/* BACKGROUND SLIDER DENGAN ANIMASI FADE */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${heroImages[currentIndex]}')`,
            }}
          />
        </AnimatePresence>

        {/* OVERLAY GRADASI GELAP AGAR TEKS TETAP JELAS DIBACA */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />

        {/* HEADER ATAS DI DALAM BANNER */}
        <div className="relative z-10 flex justify-between items-start w-full">
          {/* BADGE INDIKATOR REALTIME */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-white shadow-lg">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="uppercase tracking-widest text-[10px] sm:text-[11px]">
              LIVE RESERVATION SYSTEM
            </span>
          </div>

         
        </div>

        {/* ISI TEKS & TOMBOL DI ATAS GAMBAR */}
        <div className="relative z-10 max-w-2xl space-y-4 my-auto pt-4 pb-2">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] uppercase drop-shadow-md">
            ONE VENUE, <br />
            <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
              ENDLESS PASSION.
            </span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
            Nikmati arena olahraga premium dengan standar internasional. Pantau
            ketersediaan slot secara realtime dan kunci jadwal bermain tim Anda
            tanpa khawatir bentrok.
          </p>

          {/* TOMBOL AKSI */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={onBookingClick}
              className="group inline-flex items-center space-x-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm tracking-widest uppercase py-3.5 px-7 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Sewa Lapangan</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#fasilitas"
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-xs sm:text-sm tracking-wider uppercase py-3.5 px-6 rounded-2xl transition-all duration-200"
            >
              <span>Eksplor Arena</span>
            </a>
          </div>
        </div>

        {/* BOTTOM BAR: NAVIGASI PANAH & DOTS (GARIS PEMBATAS DIHAPUS) */}
        <div className="relative z-10 flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrev}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* INDIKATOR DOTS */}
          <div className="flex items-center space-x-2">
            {heroImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx
                    ? "w-8 bg-emerald-400"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
