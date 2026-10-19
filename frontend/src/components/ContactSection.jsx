import { useState } from "react";
import {
  MessageSquare,
  User,
  Mail,
  FileText,
  Send,
  HelpCircle,
} from "lucide-react";

export default function ContactSection() {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "Tanya Jadwal / Fasilitas",
    message: "",
  });

  const ADMIN_WHATSAPP_NUMBER = "628123456789";

  const handleSendMessage = (e) => {
    e.preventDefault();

    const textFormat = `Halo Admin Cikajang Sport Center,

Saya ingin berkonsultasi mengenai hal berikut:
👤 *Nama:* ${contactForm.name}
✉️ *Email:* ${contactForm.email}
📌 *Subjek:* ${contactForm.subject}

📝 *Pesan Pertanyaan:*
${contactForm.message}

Terima kasih.`;

    const encodedText = encodeURIComponent(textFormat);
    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodedText}`;

    window.open(whatsappUrl, "_blank");
  };

  return (
    <section
      id="kontak"
      className="bg-white dark:bg-slate-950 py-24 px-4 sm:px-6 lg:px-8 transition-colors duration-300 border-t border-slate-100 dark:border-slate-900"
    >
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-emerald-400 font-extrabold text-xs tracking-widest uppercase">
            <HelpCircle className="w-4 h-4" />
            <span>Pusat Bantuan & Konsultasi</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Hubungi Tim Admin
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base">
            Punya pertanyaan mengenai jadwal, fasilitas, atau kendala pemesanan?
            Tulis pesan Anda di bawah dan diskusikan langsung via WhatsApp.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/60 p-6 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs max-w-2xl mx-auto">
          <form onSubmit={handleSendMessage} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bambang Pamungkas"
                  value={contactForm.name}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, name: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="Contoh: bambang@gmail.com"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Subjek Pertanyaan
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <select
                  value={contactForm.subject}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, subject: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-bold cursor-pointer"
                >
                  <option value="Tanya Jadwal / Fasilitas">
                    Tanya Jadwal / Fasilitas
                  </option>
                  <option value="Kendala Pembayaran DP / Pelunasan">
                    Kendala Pembayaran DP / Pelunasan
                  </option>
                  <option value="Kerja Sama Event / Turnamen">
                    Kerja Sama Event / Turnamen
                  </option>
                  <option value="Kritik & Saran">Kritik & Saran</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Isi Pesan
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <textarea
                  required
                  rows="4"
                  placeholder="Tuliskan pertanyaan Anda secara detail..."
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-blue-500 text-xs font-medium leading-relaxed"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 font-black py-4 px-4 rounded-xl shadow-md transition duration-200 mt-6 text-xs uppercase tracking-widest flex items-center justify-center space-x-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Pesan via WhatsApp</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
