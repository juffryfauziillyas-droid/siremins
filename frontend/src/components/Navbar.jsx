import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon, LogIn } from "lucide-react";

export default function Navbar({ darkMode, setDarkMode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLoginClick = () => {
    alert("Fitur Login Autentikasi Member / Admin akan segera dibuka!");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-3 shadow-lg shadow-slate-200/50 dark:shadow-none border-b border-slate-200/60 dark:border-slate-800/60"
          : "bg-transparent py-5 border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* LOGO & BRANDING (CIKAJANG SPORT CENTER) */}
        <a
          href="#hero"
          className="flex items-center space-x-3 group cursor-pointer"
        >
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 p-[2px] shadow-md group-hover:shadow-indigo-500/25 transition-all duration-300">
              {/* GAMBAR LOGO */}
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center p-1 overflow-hidden">
                <img
                  src="/images/logo.png"
                  alt="Logo Cikajang Sport Center"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>
          </div>

          {/* TEKS NAMA BRANDING */}
          <div className="flex flex-col leading-none">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              CIKAJANG
            </span>
            <span className="text-[10px] font-extrabold tracking-[0.25em] bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent uppercase">
              SPORT CENTER
            </span>
          </div>
        </a>

        {/* MENU TAUTAN (DESKTOP) */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 dark:bg-slate-900/60 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
          <a
            href="#hero"
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-emerald-400 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 uppercase tracking-wider"
          >
            Beranda
          </a>
          <a
            href="#fasilitas"
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-emerald-400 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 uppercase tracking-wider"
          >
            Fasilitas
          </a>
          <a
            href="#kontak"
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-emerald-400 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 uppercase tracking-wider"
          >
            Bantuan & WA
          </a>
        </nav>

        {/* TOMBOL OPSI (DESKTOP) */}
        <div className="hidden md:flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-amber-400 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-xs"
            title="Ganti Tema"
          >
            {darkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleLoginClick}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-blue-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-black tracking-wider uppercase py-2.5 px-5 rounded-2xl transition-all duration-300 transform hover:-translate-y-0.5 shadow-md shadow-slate-900/10 dark:shadow-emerald-500/20 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk</span>
          </button>
        </div>

        {/* TOMBOL MENU MOBILE */}
        <div className="flex items-center space-x-2 md:hidden">
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-800"
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* DROPDOWN MENU MOBILE */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-2xl">
          <div className="flex flex-col space-y-1 font-bold text-sm">
            <a
              href="#hero"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              Beranda
            </a>
            <a
              href="#fasilitas"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              Fasilitas Arena
            </a>
            <a
              href="#kontak"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              Bantuan Admin
            </a>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleLoginClick();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 font-black py-3 rounded-xl text-xs tracking-widest uppercase shadow-md"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk / Sign In</span>
          </button>
        </div>
      )}
    </header>
  );
}
