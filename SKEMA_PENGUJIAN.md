# Skema Pengujian SIREMINS

## 1. Tujuan

Dokumen ini menjadi panduan pengujian fungsional dan teknis untuk memastikan alur customer, booking, pembayaran, sesi login, dan admin berjalan sesuai kebutuhan. Pengujian dilakukan pada lingkungan development atau staging, bukan pada data produksi.

## 2. Ruang Lingkup

- Halaman landing, navigasi, dan tampilan berdasarkan status login.
- Registrasi, login customer/admin, dan reset kata sandi dengan OTP.
- Validasi token, sesi habis, dan pembatasan akses berdasarkan role.
- Ketersediaan jadwal, pembuatan booking, riwayat, pembatalan, dan penjadwalan ulang.
- Pembayaran DP/pelunasan dan pemrosesan notifikasi Midtrans.
- Dashboard admin untuk booking dan data pengguna.
- Pemeriksaan build, lint, dan sintaks backend.

## 3. Persiapan Pengujian

### Lingkungan

1. Siapkan database MySQL khusus development/staging dan jalankan migrasi:
   ```powershell
   cd backend
   npm run migrate
   ```
2. Isi konfigurasi backend yang diperlukan pada `backend/.env`, sekurang-kurangnya konfigurasi database, `JWT_SECRET` (minimal 32 karakter), `OTP_HASH_SECRET` (minimal 32 karakter), kredensial Fonnte, dan kredensial Midtrans sandbox. Jangan menaruh nilai rahasia di dokumen atau bukti pengujian.
3. Jalankan backend:
   ```powershell
   cd backend
   npm run dev
   ```
4. Jalankan frontend di terminal terpisah:
   ```powershell
   cd frontend
   npm run dev
   ```
5. Pastikan `GET http://localhost:5000/api/health` mengembalikan status `OK`, dan halaman frontend dapat dibuka.

### Data uji

- Satu akun customer aktif dengan nomor HP yang dapat digunakan untuk login.
- Satu akun admin aktif.
- Nomor HP lain yang belum terdaftar.
- Jadwal kosong untuk tanggal besok atau sesudahnya, serta booking terkonfirmasi untuk pengujian konflik.
- Gunakan Midtrans sandbox dan nomor uji yang sesuai dokumentasi sandbox.

Setelah pengujian, batalkan atau bersihkan data booking dan akun uji sesuai kebijakan lingkungan. Hindari penghapusan massal.

## 4. Kriteria Hasil

- **Lulus**: hasil aktual sesuai hasil yang diharapkan dan tidak ada error yang menghambat alur.
- **Gagal**: hasil aktual berbeda, akses yang seharusnya ditolak berhasil, atau terjadi error yang memblokir alur.
- Catat ID kasus, hasil (lulus/gagal), tanggal, lingkungan, langkah reproduksi, hasil aktual, dan bukti berupa tangkapan layar atau respons API yang sudah disamarkan.

## 5. Kasus Uji Fungsional

### A. Landing page dan navigasi

| ID | Skenario dan langkah | Hasil yang diharapkan |
|---|---|---|
| UI-01 | Buka landing page tanpa sesi login. | Landing page, fasilitas, kontak, dan navigasi tampil; tidak ada modal booking yang terbuka otomatis. |
| UI-02 | Login sebagai customer dari landing page. | Login berhasil dan kembali ke landing page; modal booking tidak terbuka otomatis; nama akun tampil di navigasi. |
| UI-03 | Saat sudah login, pilih aksi booking dari landing page/fasilitas. | Modal booking terbuka dan nama serta nomor HP terisi dari akun customer. |
| UI-04 | Buka dan tutup modal Info Akun serta Riwayat Booking. | Modal yang dipilih tampil; modal menutup dengan kontrol yang tersedia; landing page tetap dapat diakses. |
| UI-05 | Ubah tema terang/gelap, lalu muat ulang halaman. | Tema berubah dan pilihan tersimpan setelah reload. |

### B. Akun dan autentikasi

| ID | Skenario dan langkah | Hasil yang diharapkan |
|---|---|---|
| AUTH-01 | Registrasi customer dengan nama, nomor HP baru, dan kata sandi. | Akun dibuat, pesan berhasil tampil, dan formulir kembali ke tampilan login. |
| AUTH-02 | Registrasi memakai nomor HP yang sudah terdaftar. | Registrasi ditolak dan pesan bahwa nomor telah terdaftar ditampilkan. |
| AUTH-03 | Registrasi dengan bidang wajib kosong atau konfirmasi kata sandi tidak cocok. | Data tidak dikirim atau ditolak dengan pesan validasi yang sesuai. |
| AUTH-04 | Login customer dengan kredensial benar. | Token dan data customer tersimpan; landing page tetap tampil sebagai halaman awal setelah login. |
| AUTH-05 | Login dengan kata sandi salah atau nomor yang tidak terdaftar. | Login ditolak, pesan kesalahan tampil, dan pengguna tidak dianggap login. |
| AUTH-06 | Minta OTP reset kata sandi untuk nomor yang terdaftar. | Respons tidak membocorkan apakah nomor terdaftar; jika layanan terkonfigurasi, OTP dikirim melalui WhatsApp. |
| AUTH-07 | Minta OTP dengan format nomor tidak valid atau mengulang permintaan dalam masa cooldown. | Nomor invalid ditolak; permintaan dalam cooldown tidak menghasilkan pengiriman OTP berulang. |
| AUTH-08 | Reset kata sandi dengan OTP valid, OTP salah/kedaluwarsa, atau kata sandi baru di bawah batas minimum. | Reset hanya berhasil dengan OTP valid dan kata sandi yang memenuhi validasi; percobaan invalid ditolak. |
| AUTH-09 | Perbarui profil dengan kata sandi saat ini benar dan salah. | Data profil berubah hanya jika autentikasi kata sandi saat ini valid; informasi akun yang tampil diperbarui. |
| AUTH-10 | Logout customer/admin, lalu muat ulang halaman. | Token dan data akun lokal terhapus; antarmuka menampilkan keadaan logout. |

### C. Validasi sesi dan hak akses

| ID | Skenario dan langkah | Hasil yang diharapkan |
|---|---|---|
| SESS-01 | Login customer, lalu muat ulang halaman sebelum token kedaluwarsa. | Aplikasi memvalidasi token ke backend dan tetap menampilkan akun yang benar. |
| SESS-02 | Simpan token customer yang sudah kedaluwarsa/tidak valid bersama data akun di browser, lalu muat ulang. | Validasi sesi ditolak; token dan data akun dibersihkan; halaman tidak lagi menampilkan status login customer. |
| SESS-03 | Dengan sesi customer aktif, biarkan token kedaluwarsa atau ganti dengan token invalid, lalu akses Riwayat Booking. | Permintaan terlindungi menerima 401; sesi customer dibersihkan, modal ditutup, dan pemberitahuan login ulang tampil. |
| SESS-04 | Ulangi SESS-02 dan SESS-03 untuk sesi admin. | Sesi admin tidak lagi ditampilkan sebagai aktif; token/data admin dibersihkan dan dashboard tidak tetap terbuka. |
| SESS-05 | Panggil `GET /api/my-bookings` tanpa token atau dengan token invalid. | Backend mengembalikan 401 dan tidak mengirim data booking. |
| SESS-06 | Gunakan token customer untuk endpoint admin, atau token admin untuk endpoint khusus customer. | Backend menolak akses dengan 403; data/operasi role lain tidak dapat diakses. |
| SESS-07 | Periksa endpoint validasi sesi customer `GET /api/auth/me` dan admin `GET /api/admin/me`. | Token valid hanya mengembalikan identitas yang sesuai; token tidak valid/kedaluwarsa menghasilkan 401. |

Untuk menguji kedaluwarsa tanpa menunggu masa berlaku token satu hari, gunakan token uji yang sudah expired atau ubah masa berlaku hanya di lingkungan pengujian, kemudian kembalikan konfigurasi sebelum deployment.

### D. Booking dan jadwal

| ID | Skenario dan langkah | Hasil yang diharapkan |
|---|---|---|
| BOOK-01 | Buka form booking tanpa login dan coba lanjutkan. | Sistem meminta login sebelum booking dapat dibuat. |
| BOOK-02 | Buka daftar jadwal pada tanggal valid. | Slot dengan status `BOOKED`/`BOOKED_PAID` ditampilkan sebagai tidak tersedia; slot lain dapat dipilih. |
| BOOK-03 | Pilih tanggal hari ini atau tanggal sebelum besok. | Tanggal ditolak/tidak dapat dipilih; booking hanya dapat dibuat mulai H+1. |
| BOOK-04 | Buat booking pada slot kosong dengan durasi 1, 2, atau 3 jam dan nilai DP minimum yang ditampilkan. | Booking tercatat dengan status `PENDING_DP`, memiliki ID booking, dan terhubung dengan user yang login. |
| BOOK-05 | Buat booking dengan tanggal invalid, waktu kosong/di luar jam operasional, rentang waktu terbalik, atau durasi selain 1–3 jam. | Permintaan ditolak dengan status validasi; tidak ada booking baru tercatat. |
| BOOK-06 | Buat booking dengan DP di bawah minimum, lebih besar dari harga total, atau bukan nominal bulat. | Permintaan ditolak; nilai DP tidak dapat melewati validasi backend. |
| BOOK-07 | Buat dua booking dengan waktu yang bertumpang tindih pada tanggal yang sama. | Booking kedua ditolak sebagai konflik; booking yang lebih dahulu tetap utuh. |
| BOOK-08 | Buka Riwayat Booking sebagai customer. | Hanya booking milik customer tersebut tampil, dengan tanggal, waktu, status, dan ringkasan pembayaran yang sesuai. |
| BOOK-09 | Batalkan booking `PENDING_DP` atau `BOOKED` dari akun pemilik. | Status menjadi `CANCELLED` dan slot kembali dapat dipilih jika aturan jadwal mengizinkan. |
| BOOK-10 | Coba mengubah status booking menjadi status pembayaran langsung melalui endpoint customer. | Backend menolak perubahan; perubahan pembayaran hanya dapat ditetapkan setelah notifikasi diverifikasi server. |
| BOOK-11 | Ajukan penjadwalan ulang ke slot kosong dan slot yang bertabrakan. | Perubahan ke slot valid berhasil; konflik ditolak; durasi booking tetap sama. |
| BOOK-12 | Customer mencoba mengakses/mengubah ID booking milik customer lain. | Backend menolak akses dan tidak mengungkap atau mengubah booking milik pihak lain. |

### E. Pembayaran

| ID | Skenario dan langkah | Hasil yang diharapkan |
|---|---|---|
| PAY-01 | Buat booking valid dan minta token pembayaran DP melalui Midtrans sandbox. | Token pembayaran hanya dibuat untuk booking milik customer dan berstatus `PENDING_DP`. |
| PAY-02 | Coba membuat token untuk ID tidak valid, booking milik orang lain, atau status booking yang tidak sesuai. | Permintaan ditolak dengan respons yang sesuai; transaksi tidak dapat dipakai untuk booking lain. |
| PAY-03 | Selesaikan pembayaran sandbox dengan status sukses. | Notifikasi diverifikasi backend; status booking berubah sesuai aturan pembayaran dan nilai pembayaran tercatat benar. |
| PAY-04 | Simulasikan notifikasi dengan signature, order ID, atau nominal yang tidak cocok. | Notifikasi ditolak; status booking dan pembayaran tidak berubah. |
| PAY-05 | Tutup jendela pembayaran atau pilih status pending/gagal di sandbox. | UI menampilkan status pending/gagal; booking tidak dianggap lunas sebelum verifikasi server. |
| PAY-06 | Lakukan pelunasan booking yang memenuhi syarat, lalu uji jumlah yang tersisa tidak valid atau booking tidak memenuhi syarat. | Pelunasan valid menggunakan sisa pembayaran; permintaan lain ditolak tanpa mengubah status. |

### F. Dashboard admin

| ID | Skenario dan langkah | Hasil yang diharapkan |
|---|---|---|
| ADM-01 | Login admin dengan kredensial benar. | Dashboard admin tampil dan data dimuat dari endpoint admin. |
| ADM-02 | Buka tab booking, jadwal, dan pengguna; ubah tanggal dan gunakan pencarian/filter. | Data, jadwal, filter status, dan pencarian sesuai dengan pilihan. |
| ADM-03 | Tolak atau batalkan booking yang masih dapat diubah. | Status diperbarui; perubahan pada status terminal ditolak. |
| ADM-04 | Hapus akun customer biasa setelah konfirmasi. | Customer terhapus dan daftar pengguna diperbarui. |
| ADM-05 | Coba menghapus akun admin. | Backend menolak operasi dengan 403. |
| ADM-06 | Akses endpoint admin tanpa sesi admin atau dengan token customer. | Backend mengembalikan 401/403 dan tidak memberikan data admin. |
| ADM-07 | Muat ulang dashboard setelah memilih tab. | Tab yang tersimpan digunakan jika masih termasuk tab yang valid. |

## 6. Pemeriksaan Teknis

Jalankan dari direktori yang sesuai:

```powershell
cd frontend
npm run build
npm run lint
```

```powershell
cd backend
node --check index.mjs
node --check routes/authRoutes.mjs
node --check routes/bookingRoutes.mjs
node --check routes/paymentRoutes.mjs
node --check routes/adminRoutes.mjs
```

Backend belum menyediakan skrip test otomatis pada `package.json`. Karena itu, kasus fungsional di atas dijalankan manual melalui browser dan/atau REST client pada lingkungan uji. Catat hasil build/lint dan setiap kegagalan lint yang sudah ada secara terpisah; jangan menganggap lint lulus hanya karena build berhasil.

## 7. Prioritas Pelaksanaan

1. **P0 — wajib sebelum rilis**: AUTH-04, AUTH-05, SESS-02, SESS-03, SESS-05, SESS-06, BOOK-04, BOOK-05, BOOK-07, BOOK-12, PAY-03, PAY-04, ADM-06.
2. **P1 — regresi fitur utama**: UI-01 sampai UI-05, registrasi/reset kata sandi, seluruh operasi riwayat booking, pembayaran pending/gagal, serta fitur admin.
3. **P2 — pemeriksaan pendukung**: tema, tab admin tersimpan, keadaan layanan/database yang tidak tersedia, dan pemeriksaan teknis.
