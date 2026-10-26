import { MapPin, Phone, Mail, Clock, ExternalLink } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export default function Footer() {
  const MAPS_URL = "https://maps.app.goo.gl/kMNTt2J8HJoKLofXA";
  const shouldReduceMotion = useReducedMotion();
  const leftItemVariants = {
    hidden: { opacity: 0, x: -32, y: 32 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.6,
        ease: "easeOut",
      },
    },
  };
  const rightItemVariants = {
    hidden: { opacity: 0, x: 32, y: 32 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.6,
        ease: "easeOut",
      },
    },
  };
  const bottomItemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.footer
      className="relative isolate overflow-hidden border-t border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16 pb-8 text-slate-300 transition-colors duration-300 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 right-10 -z-10 h-72 w-72 rounded-full bg-emerald-400/10 blur-[100px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-1/4 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-[110px]" />
      <div className="w-full px-6 sm:px-10 lg:px-12">
        <div
          className="grid grid-cols-1 gap-10 border-b border-white/10 pb-12 md:grid-cols-2 lg:grid-cols-4"
        >
          {/*DESKRIPSI*/}
          <div className="space-y-5 md:col-span-2 lg:col-span-2">
            <motion.div
              initial={shouldReduceMotion ? false : "hidden"}
              animate="visible"
              variants={leftItemVariants}
              className="flex items-center space-x-3"
            >
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-emerald-400 p-[2px] shadow-lg shadow-emerald-500/10">
                {/*LOGO*/}
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[14px] bg-slate-800 p-1">
                  <img
                    src="/images/logo.png"
                    alt="Logo Cikajang Sport Center"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xl font-black text-white uppercase tracking-tight">
                  CIKAJANG
                </span>
                <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.2em] text-emerald-300">
                  SPORT CENTER
                </span>
              </div>
            </motion.div>
            <motion.div
              initial={shouldReduceMotion ? false : "hidden"}
              animate="visible"
              variants={leftItemVariants}
              className="space-y-5"
            >
              <p className="max-w-sm text-xs font-medium leading-6 text-slate-300/80">
                Pusat arena olahraga terpadu dengan standar internasional.
                Sediakan pengalaman bermain terbaik untuk tim Anda dengan
                reservasi mudah dan akurat.
              </p>
              <div className="flex space-x-3 pt-2">
              {/* INSTAGRAM */}
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/40 hover:bg-emerald-400 hover:text-slate-950"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              {/* FACEBOOK */}
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/40 hover:bg-emerald-400 hover:text-slate-950"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z" />
                </svg>
              </a>
              {/* YOUTUBE */}
              <a
                href="#"
                aria-label="YouTube"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/40 hover:bg-emerald-400 hover:text-slate-950"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              </div>
            </motion.div>
          </div>
          

          {/* KONTAK & JAM OPERASIONAL */}
          <motion.div
            initial={shouldReduceMotion ? false : "hidden"}
            animate="visible"
            variants={rightItemVariants}
            className="space-y-5 lg:col-span-1"
          >
            <h4 className="border-b border-white/10 pb-3 text-xs font-black uppercase tracking-[0.16em] text-white">
              Informasi Kontak
            </h4>
            <ul className="space-y-4 text-xs font-medium text-slate-300/80">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-emerald-300"
                >
                  Jl. Raya Cikajang No. xx Padasuka, Cikajang, Garut, Jawa Barat
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-emerald-300" />
                <span>+62 812-3456-7890</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-emerald-300" />
                <span>info@cikajangsport.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-4 w-4 shrink-0 text-emerald-300" />
                <span>Setiap Hari: 08.00 - 24.00 WIB</span>
              </li>
            </ul>
          </motion.div>

          {/* PETA LOKASI */}
          <motion.div
            initial={shouldReduceMotion ? false : "hidden"}
            animate="visible"
            variants={rightItemVariants}
            className="space-y-5 lg:col-span-1"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-xs font-black uppercase tracking-[0.16em] text-white">
                Lokasi Arena
              </h4>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 transition-colors hover:text-emerald-200"
              >
                <span>Buka di Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="group relative h-48 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl shadow-black/10">
              <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-1 ring-inset ring-white/10 transition-colors group-hover:ring-emerald-300/30" />
              <iframe
                title="Peta Lokasi Cikajang Sport Arena"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3956.998806342864!2d107.79648837371806!3d-7.3540282723519415!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68a7102b013421%3A0xa58d33993e1f55da!2sCMS%20Cikajang%20Mini%20Soccer!5e0!3m2!1sid!2sus!4v1792421010452!5m2!1sid!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
          variants={bottomItemVariants}
          className="flex flex-col items-center justify-between gap-3 pt-7 text-center text-xs font-medium text-slate-400 sm:flex-row sm:text-left"
        >
          <p>&copy; 2026 CIKAJANG SPORT CENTER. Hak Cipta Dilindungi.</p>
          <a href="#hero" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-300 transition-colors hover:border-emerald-300/30 hover:text-emerald-300">
            Kembali ke atas
          </a>
        </motion.div>
      </div>
    </motion.footer>
  );
}
