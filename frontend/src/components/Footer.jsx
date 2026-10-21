import { MapPin, Phone, Mail, Clock, ExternalLink } from "lucide-react";

export default function Footer() {
  const MAPS_URL = "https://maps.app.goo.gl/kMNTt2J8HJoKLofXA";

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 border-t border-slate-800/80 transition-colors duration-300 pt-16 pb-8">
      <div className="w-full px-6 sm:px-10 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          {/* BRAND & DESKRIPSI (PENGATURAN LOGO FOOTER DI SINI) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 p-[2px]">
                {/* GAMBAR LOGO FOOTER */}
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center p-1 overflow-hidden">
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
                <span className="text-[9px] font-extrabold text-emerald-400 tracking-[0.2em] uppercase">
                  SPORT CENTER
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              Pusat arena olahraga terpadu dengan standar internasional.
              Sediakan pengalaman bermain terbaik untuk tim Anda dengan
              reservasi mudah dan akurat.
            </p>
            <div className="flex space-x-3 pt-2">
              {/* INSTAGRAM */}
              <a
                href="#"
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-emerald-500 hover:text-slate-950 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              {/* FACEBOOK */}
              <a
                href="#"
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-emerald-500 hover:text-slate-950 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z" />
                </svg>
              </a>
              {/* YOUTUBE */}
              <a
                href="#"
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-emerald-500 hover:text-slate-950 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
          

          {/* KONTAK & JAM OPERASIONAL */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-800 pb-2">
              Informasi Kontak
            </h4>
            <ul className="space-y-3 text-xs font-medium text-slate-400">
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Jl. Raya Cikajang No. xx Padasuka, Cikajang, Garut, Jawa Barat
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+62 812-3456-7890</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>info@cikajangsport.com</span>
              </li>
              <li className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Setiap Hari: 08.00 - 24.00 WIB</span>
              </li>
            </ul>
          </div>

          {/* PETA LOKASI GOOGLE MAPS */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">
                Lokasi Arena
              </h4>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <span>Buka di Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-800 shadow-md relative group">
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
          </div>
        </div>

        <div className="pt-8 text-center text-xs text-slate-500 font-medium">
          <p>&copy; 2026 CIKAJANG SPORT CENTER. Hak Cipta Dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
