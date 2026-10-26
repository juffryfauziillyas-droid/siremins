import { motion } from "framer-motion";
import {
  ShieldCheck,
  Coffee,
  Compass,
  ShowerHead,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

export default function Features({ onSelectMiniSoccer }) {
  const sportsFacilities = [
    {
      id: "mini-soccer",
      name: "Lapangan Mini Soccer",
      desc: "Fasilitas outdoor rumput sintetis premium standar FIFA. Klik kartu ini untuk reservasi kilat!",
      tag: "Outdoor Arena",
      image: "/images/mini-soccer.jpg",
    },
    {
      id: "gym",
      name: "Pusat Kebugaran (Gym)",
      desc: "Area latihan angkat beban dan kardio lengkap dengan pendingin ruangan full AC.",
      tag: "Indoor Fitness",
      image: "/images/gym.jpg",
    },
    {
      id: "badminton",
      name: "Lapangan Bulutangkis",
      desc: "Lantai interlock dan kayu berkualitas standar turnamen resmi.",
      tag: "Indoor Court",
      image: "/images/badminton.jpg",
    },
    {
      id: "pingpong",
      name: "Tenis Meja Premium",
      desc: "Area khusus tenis meja yang tenang dengan meja & peralatan kualitas tinggi.",
      tag: "Indoor Sports",
      image: "/images/pingpong.jpg",
    },
    {
      id: "senam",
      name: "Sanggar Senam & Yoga",
      desc: "Ruangan luas serbaguna dengan cermin dinding penuh & sistem audio profesional.",
      tag: "Studio Class",
      image: "/images/senam.jpg",
    },
  ];

  const supportingFacilities = [
    {
      name: "Toilet & Ruang Bilas",
      desc: "Fasilitas toilet dan ruang bilas untuk membantu Anda membersihkan diri dan menyegarkan badan setelah berolahraga.",
      icon: ShowerHead,
    },
    {
      name: "Shower Air Hangat",
      desc: "Nikmati shower air hangat agar tubuh terasa lebih nyaman setelah beraktivitas di arena olahraga.",
      icon: ShowerHead,
    },
    {
      name: "Loker Pengaman",
      desc: "Simpan barang bawaan dengan rapi selama berolahraga agar Anda dapat beraktivitas dengan lebih nyaman.",
      icon: ShieldCheck,
    },
    {
      name: "Kantin & Rest Area",
      desc: "Tempat untuk beristirahat sejenak dan menikmati makanan atau minuman sebelum maupun sesudah berolahraga.",
      icon: Coffee,
    },
    {
      name: "Mushola Nyaman",
      desc: "Ruang ibadah yang nyaman untuk menunaikan salat di sela-sela kegiatan olahraga.",
      icon: Compass,
    },
  ];

  return (
    <section
      id="fasilitas"
      className="bg-slate-100/70 dark:bg-slate-800 py-24 px-4 sm:px-6 lg:px-8 transition-colors duration-300"
    >
      <div className="w-full px-6 sm:px-10 lg:px-12 space-y-20">
        {/* HEADER SECTION */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-emerald-400 font-extrabold text-xs tracking-widest uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Fasilitas Olahraga Terintegrasi</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Arena Olahraga  <h2> & </h2> Fasilitas Utama
          </h2>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm sm:text-base">
            Kami menyediakan arena dengan standar terbaik untuk mendukung
            performa maksimal tim Anda.
          </p>
        </div>

        {/* GRID ARENA OLAHRAGA */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-3">
            Pilihan Arena
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sportsFacilities.map((facility) => {
              const isMiniSoccer = facility.id === "mini-soccer";

              return (
                <motion.div
                  key={facility.id}
                  whileHover={{ y: -8, scale: 1.015 }}
                  whileTap={isMiniSoccer ? { scale: 0.985 } : undefined}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onClick={isMiniSoccer ? onSelectMiniSoccer : undefined}
                  className={`group relative h-80 rounded-3xl bg-slate-300/70 p-[1.5px] shadow-lg shadow-slate-900/10 transition-shadow duration-500 hover:shadow-2xl hover:shadow-blue-900/20 hover:ring-4 hover:ring-emerald-400/15 dark:bg-slate-700/70 dark:shadow-black/30 dark:hover:shadow-emerald-950/40 ${
                    isMiniSoccer
                      ? "cursor-pointer ring-2 ring-blue-500/40 dark:ring-emerald-500/40 hover:ring-blue-500 dark:hover:ring-emerald-400"
                      : "cursor-default"
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-300 via-emerald-300 to-teal-200 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-70"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-300 via-emerald-300 to-teal-200 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <div className="relative z-10 flex h-full flex-col justify-end overflow-hidden rounded-[calc(1.5rem-1.5px)] p-6">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                      style={{
                        backgroundImage: `url(${facility.image})`,
                        backgroundColor: "#0f172a",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/5 opacity-95 transition-opacity duration-500 group-hover:opacity-85" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="absolute inset-3 rounded-[1.35rem] border border-white/0 transition-colors duration-500 group-hover:border-white/25" />

                    <div className="relative z-10 space-y-3 text-white transition-transform duration-500 group-hover:translate-y-[-2px]">
                      <div className="flex items-center justify-between">
                        <span className="bg-white/15 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider border border-white/20 shadow-lg shadow-black/10 transition-colors duration-300 group-hover:bg-white/25">
                          {facility.tag}
                        </span>
                        {isMiniSoccer && (
                          <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 animate-pulse">
                            <span>SEWA SEKARANG</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <h4
                        className={`font-black text-2xl tracking-wide transition-colors duration-200 ${isMiniSoccer ? "group-hover:text-emerald-400" : ""}`}
                      >
                        {facility.name}
                      </h4>
                      <p className="text-slate-300 text-xs leading-relaxed font-medium line-clamp-2">
                        {facility.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* FASILITAS PENDUKUNG */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-3">
            Fasilitas Pendukung
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {supportingFacilities.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.name}
                  whileHover={{ y: -6, scale: 1.015 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="group relative rounded-3xl bg-slate-200/80 p-[1.5px] shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-blue-900/10 hover:ring-4 hover:ring-emerald-400/10 dark:bg-slate-700/80 dark:hover:shadow-emerald-950/30"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400 via-emerald-400 to-teal-300 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-70"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400 via-emerald-400 to-teal-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <div className="relative z-10 flex h-full flex-col items-center overflow-hidden rounded-[calc(1.5rem-1.5px)] bg-white p-6 dark:bg-slate-900/60">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/5 blur-2xl transition-colors duration-300 group-hover:bg-emerald-400/20" />
                    <div className="relative flex flex-col items-center">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-emerald-400/10 text-blue-600 ring-1 ring-blue-500/10 transition-all duration-300 group-hover:scale-110 group-hover:from-blue-500 group-hover:to-emerald-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-400/15 dark:group-hover:text-slate-950">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base text-center transition-colors duration-300 group-hover:text-blue-700 dark:group-hover:text-emerald-300">
                        {item.name}
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium mt-2 text-center">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
