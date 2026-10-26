import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Sparkles,
} from "lucide-react";

export default function Hero({ onBookingClick }) {
    const heroSlides = [
        { image: "/images/mini-soccer.jpg", name: "Mini Soccer", category: "Outdoor Arena", position: "center 54%" },
        { image: "/images/gym.jpg", name: "Pusat Kebugaran", category: "Indoor Fitness", position: "center 58%" },
        { image: "/images/badminton.jpg", name: "Bulutangkis", category: "Indoor Court", position: "center 58%" },
        { image: "/images/pingpong.jpg", name: "Tenis Meja", category: "Indoor Sports", position: "center 52%" },
        { image: "/images/senam.jpg", name: "Senam & Yoga", category: "Studio Class", position: "center 52%" },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(
            () => setCurrentIndex((prev) => (prev + 1) % heroSlides.length),
            5000,
        );
        return () => clearInterval(timer);
    }, [heroSlides.length]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % heroSlides.length);
    };

    const handlePrev = () => {
        setCurrentIndex(
            (prev) => (prev - 1 + heroSlides.length) % heroSlides.length,
        );
    };

    return (
        <section id="hero" className="w-full px-3 pt-24 pb-6 font-sans sm:px-6 sm:pt-28 lg:px-8">
            <div className="relative mx-auto flex min-h-[650px] w-full max-w-[1600px] flex-col justify-between overflow-hidden rounded-[2rem] bg-slate-800 p-5 shadow-2xl shadow-slate-950/20 sm:min-h-[700px] sm:rounded-[2.5rem] sm:p-8 lg:min-h-[78vh] lg:p-12">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={heroSlides[currentIndex].image}
                        initial={{ opacity: 0, scale: 1.08 }}
                        animate={{ opacity: 1, scale: 1.02 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        className="absolute inset-0 bg-cover bg-no-repeat brightness-110 contrast-105 saturate-125 lg:inset-y-0 lg:left-[28%] lg:right-0"
                        style={{
                            backgroundImage: `url('${heroSlides[currentIndex].image}')`,
                            backgroundPosition: heroSlides[currentIndex].position,
                        }}
                    />
                </AnimatePresence>

                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/15 lg:from-slate-900 lg:via-slate-900/75 lg:via-40% lg:to-transparent lg:to-75%" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-transparent to-slate-900/15 lg:from-slate-900/55 lg:to-transparent" />
                <div className="absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-emerald-400/20 blur-[100px] mix-blend-screen" />
                <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-blue-500/20 blur-[100px]" />

                <div className="relative z-10 flex items-start justify-between gap-3">
                    <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-slate-900/50 px-4 py-2.5 text-white shadow-lg shadow-black/10 backdrop-blur-xl">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] sm:text-[10px]">
                            Live reservation system
                        </span>
                    </div>
                    <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-slate-900/45 px-4 py-2.5 text-xs font-bold text-white/90 backdrop-blur-xl sm:inline-flex">
                        <MapPin className="h-3.5 w-3.5 text-emerald-300" />
                        <span>Cikajang Sport Center</span>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="relative z-10 my-auto max-w-3xl py-12 sm:py-16"
                >
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3.5 py-2 text-emerald-100 backdrop-blur-md">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] sm:text-[10px]">
                            {heroSlides[currentIndex].category}
                        </span>
                    </div>
                    <h1 className="max-w-3xl text-4xl font-black uppercase leading-[0.98] tracking-[-0.045em] text-white drop-shadow-lg sm:text-6xl lg:text-7xl xl:text-8xl">
                        One venue,
                        <br />
                        <span className="bg-gradient-to-r from-blue-300 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                            endless passion.
                        </span>
                    </h1>

                    <p className="mt-6 max-w-xl text-sm font-medium leading-7 text-slate-100/90 drop-shadow-md sm:text-base sm:leading-8">
                        Temukan arena olahraga favoritmu dalam satu tempat. Cek jadwal
                        tersedia dan amankan waktu bermain dengan mudah.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <button
                            onClick={onBookingClick}
                            className="group inline-flex items-center gap-3 rounded-2xl bg-emerald-400 px-6 py-4 text-xs font-black uppercase tracking-[0.12em] text-slate-950 shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-300 hover:shadow-emerald-400/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 sm:px-7 sm:text-sm"
                        >
                            <Calendar className="h-4 w-4" />
                            <span>Sewa Lapangan</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>

                        <a
                            href="#fasilitas"
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] text-white backdrop-blur-xl transition-all duration-300 hover:border-white/40 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-sm"
                        >
                            Eksplor Arena
                        </a>
                    </div>
                </motion.div>

                <div className="relative z-10 flex items-end justify-between gap-4 border-t border-white/15 pt-5">
                    <div className="flex items-center gap-3">
                        <button
                            aria-label="Foto fasilitas sebelumnya"
                            type="button"
                            onClick={handlePrev}
                            className="rounded-xl border border-white/15 bg-slate-900/45 p-2.5 text-white backdrop-blur-xl transition-all hover:border-white/30 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            aria-label="Foto fasilitas berikutnya"
                            type="button"
                            onClick={handleNext}
                            className="rounded-xl border border-white/15 bg-slate-900/45 p-2.5 text-white backdrop-blur-xl transition-all hover:border-white/30 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <div className="hidden pl-2 text-white sm:block">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">
                                Sedang ditampilkan
                            </p>
                            <p className="mt-0.5 text-sm font-extrabold">{heroSlides[currentIndex].name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/40 p-2.5 backdrop-blur-xl">
                        {heroSlides.map((slide, idx) => (
                            <button
                                key={slide.image}
                                type="button"
                                aria-label={`Tampilkan ${slide.name}`}
                                aria-current={currentIndex === idx ? "true" : undefined}
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    currentIndex === idx
                                        ? "w-8 bg-emerald-300"
                                        : "w-2 bg-white/45 hover:bg-white/90"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}