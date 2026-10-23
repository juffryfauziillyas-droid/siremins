import { motion } from "framer-motion";
import {
  ShieldCheck,
  Coffee,
  Compass,
  Smile,
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
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Sint incidunt nisi sequi omnis adipisci sunt expedita fugiat non mollitia iure cumque hic, aspernatur magni harum, perferendis eveniet nemo, sapiente voluptatum?",
    },
    {
      name: "Shower Air Hangat",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Sint incidunt nisi sequi omnis adipisci sunt expedita fugiat non mollitia iure cumque hic, aspernatur magni harum, perferendis eveniet nemo, sapiente voluptatum?",
    },
    {
      name: "Loker Pengaman",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Sint incidunt nisi sequi omnis adipisci sunt expedita fugiat non mollitia iure cumque hic, aspernatur magni harum, perferendis eveniet nemo, sapiente voluptatum?",
    },
    {
      name: "Kantin & Rest Area",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Sint incidunt nisi sequi omnis adipisci sunt expedita fugiat non mollitia iure cumque hic, aspernatur magni harum, perferendis eveniet nemo, sapiente voluptatum?",
    },
    {
      name: "Mushola Nyaman",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Sint incidunt nisi sequi omnis adipisci sunt expedita fugiat non mollitia iure cumque hic, aspernatur magni harum, perferendis eveniet nemo, sapiente voluptatum?",
    },
  ];

  return (
    <section
      id="fasilitas"
      className="bg-slate-100/70 dark:bg-slate-950 py-24 px-4 sm:px-6 lg:px-8 transition-colors duration-300"
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
            {sportsFacilities.map((facility, index) => {
              const isMiniSoccer = facility.id === "mini-soccer";

              return (
                <motion.div
                  key={index}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onClick={isMiniSoccer ? onSelectMiniSoccer : undefined}
                  className={`relative h-80 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-end p-6 border border-slate-200 dark:border-slate-800 ${
                    isMiniSoccer
                      ? "cursor-pointer ring-2 ring-blue-500/40 dark:ring-emerald-500/40 hover:ring-blue-600 dark:hover:ring-emerald-400"
                      : "cursor-default"
                  }`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                    style={{
                      backgroundImage: `url(${facility.image})`,
                      backgroundColor: "#0f172a",
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent opacity-90" />

                  <div className="relative z-10 space-y-2 text-white">
                    <div className="flex items-center justify-between">
                      <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-white/10">
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
            {supportingFacilities.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col space-y-4 hover:shadow-md transition-shadow duration-300"
                >
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base text-center">
                      {item.name}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium mt-1 text-center">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
