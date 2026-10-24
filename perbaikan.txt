CATATAN ANALISIS DAN RENCANA TINDAK LANJUT SIREMINS
Diperbarui: 24 Oktober 2026
Daftar prioritas ini hanya memuat tindak lanjut yang belum selesai atau belum
diverifikasi. Implementasi yang sudah selesai dicatat terpisah agar tidak
dianggap sebagai pekerjaan coding yang masih terbuka.

STATUS YANG SUDAH DITERAPKAN - BUKAN PRIORITAS PERBAIKAN

- Reset password sudah menggunakan OTP WhatsApp via Fonnte. OTP berlaku 5 menit,
  ada cooldown 1 menit dan batas 5 percobaan, serta hash OTP disimpan di database.
- Booking menyimpan nominal dp_amount. Setelah pembayaran diverifikasi Midtrans,
  nominal penuh mengubah status menjadi BOOKED_PAID.
- Midtrans Server Key dan mode production/sandbox dibaca dari backend/.env;
  fallback Server Key di kode sudah dihapus.
- Prioritas keamanan poin 1 sudah diimplementasikan: autentikasi dan pemeriksaan
  role admin; autentikasi customer; pemeriksaan kepemilikan booking melalui
  user_id; dan identitas pemesan berasal dari akun terverifikasi.
- Webhook Midtrans sudah diimplementasikan: order ID unik dan nominal dicatat;
  signature diverifikasi; status transaksi diverifikasi kembali melalui API
  Midtrans; order, nominal, status, dan booking dicocokkan sebelum status booking
  berubah. Callback browser tidak menetapkan status pembayaran.
- Endpoint admin/customer tidak dapat menetapkan BOOKED atau BOOKED_PAID secara
  manual. Admin/customer masih dapat melakukan pembatalan/penolakan sesuai
  endpoint masing-masing.
- Aturan transisi backend sudah dibatasi: customer hanya dapat membatalkan
  booking PENDING_DP/BOOKED; admin hanya dapat REJECTED/CANCELLED untuk
  PENDING_DP/BOOKED; reschedule hanya untuk PENDING_DP/BOOKED/BOOKED_PAID.
  Pemeriksaan status reschedule dilakukan kembali dengan row lock dan transaksi.
- Penanganan gagal membuat booking sudah diperjelas: validasi, konflik jadwal,
  lock, koneksi, skema, dan kegagalan tak terduga dibedakan; penyebab teknis
  dicatat di server tanpa membocorkan detail database kepada pengguna.
- Harga paket dan minimum DP memiliki satu sumber di backend. Endpoint
  `GET /api/booking-pricing` menyediakan harga untuk formulir; backend yang sama
  menghitung rincian booking dan pembayaran.
- Ringkasan total, DP, dan sisa pelunasan My Booking berasal dari API backend.
- Handler booking lama `handleBooking` di `App.jsx`, yang tidak mengirim
  `dp_amount`, dan prop yang tidak digunakan telah dihapus. Checkout dilakukan
  melalui `BookingSection.jsx`.

Runner migrasi dan tabel `schema_migrations` sudah tersedia melalui
`npm run migrate:status` dan `npm run migrate` dari folder backend. Pemeriksaan
database aktif belum berhasil dijalankan di sesi ini karena sandbox Windows
menolak eksekusi perintah; status migrasi aktual masih belum diketahui.
Notification URL Midtrans, konfigurasi rahasia di `backend/.env`, serta
pengujian integrasi juga belum diverifikasi.
Pembayaran sukses yang tiba setelah booking dibatalkan atau jadwalnya bentrok
dicatat sebagai `PAID_REVIEW` untuk pemeriksaan/refund manual. Transaksi lama
yang tidak memiliki catatan order lokal perlu dibuatkan token pembayaran baru.
`JWT_SECRET` wajib berupa nilai acak minimal 32 karakter; pengguna perlu login
kembali bila secret diganti. Jangan memasukkan nilai rahasia ke dokumen ini
atau membagikannya lewat chat.

PRIORITAS KRITIS - KEAMANAN

1. Deploy dan uji webhook Midtrans pada sandbox sebelum produksi.
   - Terapkan migrasi tabel transaksi dan atur Notification URL ke
     `/api/payment/notification`.
   - Uji DP, pembayaran penuh, pelunasan, notifikasi duplikat, signature/
     nominal/order salah, status pending/expired, dan callback terlambat.
   - Pastikan kegagalan panggilan status API Midtrans menghasilkan retry yang
     aman dari Midtrans, dan siapkan pemantauan `PAID_REVIEW` serta proses
     pemeriksaan/refund manual.

2. Uji transisi status booking pada tahap pengujian akhir.
   - Implementasi sudah membatasi perubahan status sesuai aturan di atas;
     pengujian otomatis dan integrasi ditunda sampai tahap pengujian akhir.
   - Uji agar hanya webhook sukses yang mengubah booking ke BOOKED atau
     BOOKED_PAID; status terminal tidak dapat dibuka kembali melalui endpoint.
   - Uji reschedule untuk status yang diizinkan dan ditolak.
   - Referensi: backend/controllers/bookingController.mjs,
     backend/controllers/adminController.mjs,
     backend/controllers/paymentController.mjs.

PRIORITAS TINGGI - BOOKING DAN PEMBAYARAN

3. Verifikasi dan catat migrasi skema pada setiap database.
   - Jalankan `npm run migrate:status` dari folder backend untuk melihat kondisi
     empat migrasi DP, OTP, relasi user_id booking, dan transaksi Midtrans.
   - Jalankan `npm run migrate` untuk menerapkan migrasi tertunda dan mencatat
     migrasi yang skemanya sudah terpasang di tabel `schema_migrations`.
   - Ulangi pada setiap database/environment dan pastikan perintah status
     berakhir tanpa migrasi `PENDING` atau `UNRECORDED`.

PRIORITAS MENENGAH - OPERASIONAL DAN KUALITAS

4. Verifikasi akhir penanganan error booking.
   - Implementasi kategorisasi dan pesan aman sudah selesai, tetapi build,
     pengujian runtime, dan pengujian tiap kategori error belum dilakukan.
   - Jalankan bersama pengujian akhir sesuai jadwal pengujian proyek.
   - Referensi: backend/controllers/bookingController.mjs,
     backend/services/bookingSlotService.mjs.

5. Perbaiki health check dan kesiapan koneksi database.
   - Kegagalan koneksi awal hanya dicatat dan server masih dapat berjalan.
   - Endpoint health check belum memeriksa koneksi database.
   - Bedakan status aplikasi aktif dan status kesiapan database.
   - Referensi: backend/db.mjs, backend/index.mjs.

6. Pindahkan URL API frontend ke konfigurasi environment.
   - URL localhost:5000 masih ditulis langsung di beberapa komponen.
   - Atur URL lokal dan deployment secara terpisah.
   - Referensi: frontend/src/App.jsx dan komponen frontend yang memanggil API.

7. Batasi CORS ke domain frontend yang diizinkan.
   - CORS saat ini dikonfigurasi secara umum.
   - CORS bukan pengganti autentikasi dan otorisasi.
   - Referensi: backend/index.mjs.

8. Evaluasi risiko XSS dan opsi penyimpanan token yang lebih aman.
   - Token autentikasi saat ini disimpan di localStorage.
   - Referensi: frontend/src/App.jsx, frontend/src/components/Login.jsx.

9. Lengkapi validasi input server-side.
   - Validasi tanggal, jam operasional, durasi, nominal DP booking, dan
     transisi status sudah diterapkan di backend.
   - Tinjau validasi nama dan nomor HP serta konsistensi validasi input pada
     endpoint lain; jangan hanya mengandalkan kontrol frontend.

10. Pastikan zona waktu konsisten untuk auto-cancel.
    - Pastikan zona waktu server dan MySQL konsisten dengan WIB.
    - Uji batas lima menit sebelum waktu mulai.
    - Referensi: backend/services/autoCancelService.mjs.

11. Selaraskan dokumentasi skema dan status.
    - ERD dan daftar status perlu sesuai dengan struktur dan status yang
      digunakan aplikasi.
    - Referensi: TAHAP_PEMBUATAN_PROYEK.md.

URUTAN TINDAK LANJUT YANG DISARANKAN

1. Terapkan migrasi yang belum ada, set konfigurasi environment, dan atur
   Notification URL Midtrans.
2. Uji webhook Midtrans serta kasus `PAID_REVIEW` dan proses refund manual.
3. Uji akses tanpa izin, kepemilikan booking, dan semua transisi status.
4. Uji hasil implementasi penanganan error booking, harga terpusat, dan jalur
   checkout booking bersama pengujian akhir.
5. Implementasikan health check, konfigurasi URL API, pembatasan CORS,
   evaluasi token, dan konsistensi zona waktu.
6. Jalankan lint/build frontend serta tes backend dan integrasi.

BATASAN ANALISIS

- Implementasi webhook telah diperiksa secara statis, tetapi build/lint dan
  pengujian Midtrans sandbox/produksi belum berhasil dilakukan.
- Status penerapan migrasi, konfigurasi environment, dan URL webhook aktif
  belum diverifikasi.
