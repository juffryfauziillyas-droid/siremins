# Panduan Simulasi Pengujian SIREMINS

Dokumen ini berisi urutan simulasi pengujian manual SIREMINS dari persiapan
lingkungan sampai pemeriksaan akhir. Jalankan pada database development atau
staging, bukan database produksi.

## 1. Tujuan dan ruang lingkup

Simulasi mencakup:

- Landing page, navigasi, tema, dan tampilan responsif.
- Registrasi, login, logout, pemulihan kata sandi, dan validasi sesi.
- Pemesanan jadwal, riwayat, pembatalan, serta penjadwalan ulang.
- Pembayaran DP/pelunasan melalui Midtrans sandbox.
- Dashboard dan pembatasan akses admin.
- Formulir kontak WhatsApp dan pemeriksaan teknis dasar.

## 2. Aturan keselamatan pengujian

1. Gunakan database dan akun khusus pengujian. Jangan menguji transaksi atau
   mengubah data customer sungguhan.
2. Gunakan Midtrans sandbox, bukan mode produksi.
3. Jangan menempelkan password, token, OTP, kunci Midtrans, atau token Fonnte
   pada dokumen, screenshot, atau laporan.
4. Pilih tanggal booking yang cukup jauh agar tidak terpengaruh auto-cancel
   yang berjalan mendekati waktu mulai.
5. Catat ID booking yang dibuat agar hanya data uji tersebut yang dibatalkan
   atau dibersihkan setelah pengujian.

## 3. Persiapan lingkungan

### Langkah 1 — Siapkan konfigurasi

Isi `backend/.env` dengan konfigurasi database, `JWT_SECRET` dan
`OTP_HASH_SECRET` (masing-masing minimal 32 karakter), `FONNTE_TOKEN`,
`MIDTRANS_SERVER_KEY`, dan `MIDTRANS_IS_PRODUCTION=false`.

Isi `frontend/.env` dengan `VITE_ADMIN_WHATSAPP_NUMBER` bila akan menguji
formulir kontak. Gunakan nomor admin khusus pengujian bila tersedia. Setelah
mengubah environment frontend, jalankan ulang Vite.

Gunakan file `.env.example` sebagai referensi nama variabel; jangan
mempublikasikan isi file `.env`.

### Langkah 2 — Periksa dan terapkan migrasi database

Dari PowerShell pada root repositori:

```powershell
Set-Location backend
npm run migrate:status
npm run migrate
```

Migrasi menyiapkan kolom dan tabel yang dibutuhkan booking, OTP, dan
pembayaran. Jalankan pada database pengujian yang benar. Jika ada error,
hentikan simulasi dan selesaikan masalah koneksi atau skema sebelum lanjut.

### Langkah 3 — Jalankan backend dan frontend

Buka dua terminal PowerShell terpisah.

Terminal backend:

```powershell
Set-Location backend
npm run dev
```

Terminal frontend:

```powershell
Set-Location frontend
npm run dev
```

Buka alamat lokal yang ditampilkan Vite (umumnya `http://localhost:5173`).
Pastikan `http://localhost:5000/api/health` mengembalikan status `OK`.

### Langkah 4 — Siapkan data uji

Siapkan:

- Nomor HP baru yang dapat menerima pesan WhatsApp/OTP.
- Satu akun customer pengujian, baru atau yang sudah tersedia.
- Satu akun admin pengujian yang telah disiapkan melalui cara administrasi
  proyek; jangan mengandalkan pendaftaran customer untuk membuat admin.
- Satu tanggal mulai besok atau setelahnya, dengan setidaknya satu slot kosong.
- Akses kredensial Midtrans sandbox dan Fonnte bila menguji layanan tersebut.

## 4. Simulasi pengujian berurutan

Isi kolom hasil dengan **Lulus**, **Gagal**, atau **Tidak diuji**, lalu catat
nomor kasus serta bukti yang sudah disamarkan.

### Tahap A — Landing page dan tampilan

1. Buka landing page dalam keadaan logout.
2. Periksa navbar, Hero, daftar fasilitas, bagian kontak, dan footer.
3. Ubah tema terang/gelap lalu muat ulang halaman.
4. Uji tampilan pada lebar desktop dan mobile.
5. Jika tersedia, aktifkan preferensi perangkat `prefers-reduced-motion` dan
   periksa bahwa animasi tidak mengganggu.

| ID | Hasil yang diharapkan | Hasil |
|---|---|---|
| UI-01 | Landing page dan seluruh bagian utama tampil tanpa modal booking otomatis. | |
| UI-02 | Tema yang dipilih bertahan setelah reload. | |
| UI-03 | Tata letak tidak terpotong pada desktop maupun mobile. | |
| UI-04 | Motion tetap wajar dan menghormati preferensi reduced motion. | |

### Tahap B — Registrasi, login, dan logout customer

1. Dari login, buka formulir pendaftaran customer.
2. Daftar menggunakan nomor HP baru, nama, dan password uji.
3. Coba daftar kembali dengan nomor yang sama.
4. Login menggunakan akun customer yang baru dibuat.
5. Pastikan setelah login aplikasi tetap berada di landing page.
6. Muat ulang halaman, lalu pastikan sesi customer yang masih valid
   dipertahankan.
7. Logout dan muat ulang halaman.

| ID | Hasil yang diharapkan | Hasil |
|---|---|---|
| AUTH-01 | Registrasi valid berhasil dan aplikasi memberi konfirmasi. | |
| AUTH-02 | Nomor yang sudah terdaftar ditolak dengan pesan yang sesuai. | |
| AUTH-03 | Login dengan password salah ditolak dan pengguna tetap logout. | |
| AUTH-04 | Login berhasil, nama akun tampil, dan landing page tetap terbuka. | |
| AUTH-05 | Sesi valid tetap dikenali setelah reload. | |
| AUTH-06 | Logout membersihkan sesi; reload tidak mengembalikan status login. | |

### Tahap C — Reset password dan OTP (jika Fonnte tersedia)

1. Dari layar login, minta OTP menggunakan nomor customer pengujian.
2. Pastikan OTP diterima melalui WhatsApp.
3. Coba gunakan OTP yang salah atau kedaluwarsa.
4. Gunakan OTP valid untuk mengganti password, lalu login dengan password
   baru.
5. Ulangi permintaan segera untuk memeriksa cooldown.

| ID | Hasil yang diharapkan | Hasil |
|---|---|---|
| OTP-01 | Permintaan valid diproses dan OTP dikirim melalui Fonnte. | |
| OTP-02 | OTP salah/kedaluwarsa ditolak; password lama tidak berubah. | |
| OTP-03 | OTP valid mengganti password; password baru dapat digunakan login. | |
| OTP-04 | Permintaan ulang dalam cooldown tidak mengirim OTP berulang. | |

Jika Fonnte tidak dikonfigurasi, tandai tahap ini **Tidak diuji**, bukan
**Lulus**.

### Tahap D — Booking dan riwayat customer

1. Login sebagai customer.
2. Pilih aksi booking dari landing page/fasilitas. Pastikan nama dan nomor
   akun terisi otomatis.
3. Pilih tanggal mulai besok atau setelahnya dan periksa jadwal.
4. Pilih satu slot yang tersedia, durasi yang didukung, dan nominal DP
   minimum yang ditampilkan.
5. Lanjutkan alur sampai booking tercatat. Catat ID booking dan status awal.
6. Buka riwayat booking dan cocokkan tanggal, waktu, status, DP, serta sisa
   pembayaran.
7. Uji tanggal yang tidak valid, DP di bawah minimum, serta slot yang
   bertabrakan menggunakan data pengujian.
8. Uji penjadwalan ulang ke slot kosong dan ke slot yang sudah terisi.
9. Uji pembatalan pada booking pengujian yang statusnya mengizinkan.

| ID | Hasil yang diharapkan | Hasil |
|---|---|---|
| BOOK-01 | Aksi booking dari keadaan logout meminta customer login. | |
| BOOK-02 | Customer login dapat membuka booking; identitas akun terisi. | |
| BOOK-03 | Tanggal hari ini/masa lalu tidak dapat dipakai; tanggal valid dapat dipilih. | |
| BOOK-04 | Slot kosong menghasilkan booking `PENDING_DP` dan ID booking. | |
| BOOK-05 | Data tanggal, waktu, durasi, atau DP invalid ditolak backend. | |
| BOOK-06 | Jadwal bertabrakan ditolak; booking yang sudah ada tidak berubah. | |
| BOOK-07 | Riwayat hanya menampilkan booking milik customer tersebut. | |
| BOOK-08 | Penjadwalan ulang slot kosong dapat diproses; slot konflik ditolak. | |
| BOOK-09 | Pembatalan hanya berhasil untuk booking pemilik dan status yang diizinkan. | |

### Tahap E — Pembayaran Midtrans (sandbox)

Lanjutkan menggunakan booking pengujian yang masih menunggu DP.

1. Mulai pembayaran DP melalui tombol pembayaran pada booking.
2. Selesaikan transaksi menggunakan instruksi dan metode uji Midtrans sandbox.
3. Tunggu notifikasi server dan muat ulang riwayat booking.
4. Jika alur pelunasan tersedia, lakukan pelunasan pada booking yang memenuhi
   syarat.
5. Uji juga transaksi pending atau gagal tanpa menyatakan booking lunas.
6. Jangan mengirim notifikasi palsu ke endpoint produksi. Pengujian signature,
   order ID, nominal, dan notifikasi duplikat hanya dilakukan pada environment
   sandbox/staging yang disiapkan untuk pengujian.

| ID | Hasil yang diharapkan | Hasil |
|---|---|---|
| PAY-01 | Token hanya dibuat untuk booking milik customer dengan status yang sesuai. | |
| PAY-02 | Transaksi sandbox sukses diverifikasi backend dan status booking diperbarui. | |
| PAY-03 | Pending/gagal tidak dianggap sebagai pembayaran sukses. | |
| PAY-04 | Pelunasan memakai sisa tagihan dan hanya dapat dilakukan pada status yang sesuai. | |
| PAY-05 | Notifikasi tidak valid tidak mengubah status booking. | |

Catat respons aktual dengan menyamarkan data pribadi dan rahasia transaksi.
Jika konfigurasi sandbox atau URL notifikasi belum siap, tandai tahap ini
**Tidak diuji**.

### Tahap F — Dashboard dan hak akses admin

1. Logout dari customer, lalu login menggunakan akun admin pengujian.
2. Buka daftar booking dan pengguna pada dashboard.
3. Cari booking pengujian yang dibuat pada Tahap D.
4. Coba aksi admin yang tersedia pada booking dengan status yang dapat diubah.
5. Logout admin.
6. Coba akses halaman atau endpoint admin tanpa login, lalu dengan token
   customer jika menguji melalui REST client.

| ID | Hasil yang diharapkan | Hasil |
|---|---|---|
| ADM-01 | Login admin menampilkan dashboard dan data yang sesuai. | |
| ADM-02 | Aksi admin mengikuti aturan transisi status; status terminal tidak dibuka kembali. | |
| ADM-03 | Tanpa token endpoint terlindungi menolak dengan `401`. | |
| ADM-04 | Token customer tidak mendapat akses admin (`403` atau penolakan sesuai API). | |
| ADM-05 | Admin tidak dapat menghapus akun admin jika backend melarangnya. | |

### Tahap G — Validasi sesi kedaluwarsa

Lakukan hanya pada browser dan akun pengujian.

1. Login customer, lalu ganti token customer di penyimpanan browser dengan
   token uji invalid/kedaluwarsa.
2. Muat ulang halaman dan coba buka riwayat booking.
3. Pastikan aplikasi membersihkan data sesi yang tidak valid.
4. Ulangi langkah yang sama untuk admin.
5. Setelah selesai, login kembali dengan akun yang benar.

| ID | Hasil yang diharapkan | Hasil |
|---|---|---|
| SESS-01 | Token invalid customer tidak membuat UI tetap menampilkan customer login. | |
| SESS-02 | Request terlindungi customer mendapat `401`; token/data lokal dibersihkan. | |
| SESS-03 | Sesi admin invalid tidak membuat dashboard tetap aktif. | |
| SESS-04 | Endpoint `/api/auth/me` dan `/api/admin/me` hanya menerima token yang sesuai. | |

Jangan mengubah masa berlaku token di production untuk keperluan pengujian.

### Tahap H — Formulir kontak WhatsApp

1. Pastikan `VITE_ADMIN_WHATSAPP_NUMBER` berisi nomor tujuan pengujian.
2. Isi nama, nomor HP, subjek, dan pesan pada bagian kontak.
3. Kirim formulir, lalu periksa tab/aplikasi WhatsApp yang terbuka dan isi
   pesan yang disusun.
4. Kembali ke halaman dan pastikan formulir kosong.
5. Secara terpisah, uji konfigurasi nomor yang tidak valid pada environment
   lokal dan pastikan pesan kesalahan tampil.

| ID | Hasil yang diharapkan | Hasil |
|---|---|---|
| WA-01 | Pesan berisi data formulir dan diarahkan ke nomor admin yang dikonfigurasi. | |
| WA-02 | Link dibuka di tab baru; formulir dikosongkan setelah dibuka. | |
| WA-03 | Nomor tidak valid/tidak dikonfigurasi menampilkan pesan kesalahan. | |

### Tahap I — Pemeriksaan teknis

Dari folder frontend:

```powershell
Set-Location frontend
npm run build
npm run lint
```

Dari folder backend, cek sintaks file server dan route:

```powershell
Set-Location backend
node --check index.mjs
node --check routes/authRoutes.mjs
node --check routes/bookingRoutes.mjs
node --check routes/paymentRoutes.mjs
node --check routes/adminRoutes.mjs
```

Backend belum memiliki skrip test otomatis. Jalankan skenario fungsional
secara manual melalui browser dan, bila diperlukan, REST client. Catat hasil
lint secara terpisah dari build; build yang sukses tidak otomatis berarti
lint lulus. Peringatan ukuran bundle bukan kegagalan build jika proses build
berhasil selesai.

## 5. Kriteria lulus/gagal

- **Lulus:** hasil aktual sesuai hasil yang diharapkan dan tidak ada error
  yang menghambat alur.
- **Gagal:** hasil aktual berbeda, akses yang seharusnya ditolak justru
  berhasil, atau alur terhenti karena error.
- **Tidak diuji:** layanan eksternal atau data yang diperlukan belum tersedia.

Untuk setiap kasus, catat ID, status, tanggal, browser, environment, langkah
reproduksi, hasil aktual, dan bukti yang telah disamarkan.

### Formulir hasil simulasi

| ID kasus | Status | Hasil aktual / catatan | Bukti (tanpa rahasia) |
|---|---|---|---|
| Contoh: UI-01 | Lulus/Gagal/Tidak diuji | Isi setelah menjalankan simulasi | Nama file screenshot/log |
|  |  |  |  |
|  |  |  |  |

## 6. Penutupan pengujian

1. Logout dari semua akun pengujian.
2. Catat ID booking uji, status akhir, serta transaksi sandbox terkait.
3. Batalkan atau bersihkan hanya data uji yang sudah dicatat dan hanya pada
   database development/staging. Hindari penghapusan massal.
4. Pastikan tidak ada konfigurasi uji atau kredensial sandbox yang tertinggal
   pada environment production.
5. Ringkas kasus yang gagal atau tidak diuji sebagai tindak lanjut sebelum
   rilis.
