# 📋 PANDUAN & CATATAN PERBAIKAN SISTEM SIREMINS
*(Sistem Reservasi Cikajang Sport Center)*

Dokumen ini berisi daftar lengkap bug kritis, celah arsitektur/keamanan, beserta panduan langkah demi langkah dan potongan kode siap pakai untuk perbaikan aplikasi SIREMINS.

---

## 📑 DAFTAR ISI
1. [Ringkasan Masalah & Tingkat Prioritas](#1-ringkasan-masalah--tingkat-prioritas)
2. [Perbaikan 1: Mismatch Prop Navbar (Crash saat Klik Akun/Logout)](#2-perbaikan-1-mismatch-prop-navbar-crash-saat-klik-akunlogout)
3. [Perbaikan 2: Implementasi Endpoint Booking di Backend](#3-perbaikan-2-implementasi-endpoint-booking-di-backend)
4. [Perbaikan 3: Restrukturisasi `app.listen` & Pembersihan File Redundan](#4-perbaikan-3-restrukturisasi-applisten--pembersihan-file-redundan)
5. [Perbaikan 4: Pengamanan Endpoint & Middleware Otorisasi JWT](#5-perbaikan-4-pengamanan-endpoint--middleware-otorisasi-jwt)
6. [Perbaikan 5: Pembersihan Teks Placeholder Lorem Ipsum](#6-perbaikan-5-pembersihan-teks-placeholder-lorem-ipsum)
7. [Checklist Pengujian Pasca Perbaikan](#7-checklist-pengujian-pasca-perbaikan)

---

## 1. RINGKASAN MASALAH & TINGKAT PRIORITAS

| No | Komponen | Masalah / Kebutuhan | Tingkat Bahaya | Dampak |
|---|---|---|---|---|
| 1 | **Frontend** (`Navbar.jsx` / `App.jsx`) | Nama prop berbeda (`onOpenAccount` vs `onOpenAccountInfo`) | 🔴 **Kritis** | Error JavaScript runtime, modal tidak bisa terbuka saat diklik |
| 2 | **Backend** (`index.mjs`) | Endpoint `GET /api/bookings` & `POST /api/bookings` belum ada | 🔴 **Kritis** | Fitur booking tidak berfungsi sama sekali (`404 Not Found`) |
| 3 | **Backend** (`index.mjs`) | Posisi `app.listen()` mendahului route `/api/my-bookings` | 🟡 **Sedang** | Antipattern Express, rute di bawah `listen` rentan terlewat |
| 4 | **Backend** (`index1.mjs`) | File sisa / duplikasi tanpa fungsi listener dan database | 🟢 **Rendah** | Mengotori struktur project |
| 5 | **Backend** (`index.mjs`) | Query `phone_number` & `id` tanpa validasi JWT token | 🟡 **Sedang** | Celah keamanan IDOR (riwayat orang lain dapat diintip) |
| 6 | **Frontend** (`Features.jsx`) | Masih ada teks *Lorem Ipsum* di fasilitas pendukung | 🟢 **Rendah** | Estetika UI & informasi fasilitas belum informatif |

---

## 2. PERBAIKAN 1: MISMATCH PROP NAVBAR (CRASH SAAT KLIK AKUN/LOGOUT)

### 🔍 Penyebab Masalah:
Pada file `frontend/src/App.jsx`, props yang dikirimkan ke komponen `<Navbar />` menggunakan nama:
* `onOpenAccount`
* `onOpenLogout`

Sedangkan pada file `frontend/src/components/Navbar.jsx`, props yang diterima dan dipanggil bernama:
* `onOpenAccountInfo`
* `onOpenLogoutConfirm`

Karena nama berbeda, saat pengguna login lalu membuka dropdown dan mengklik **"Info Akun"** atau **"Keluar (Logout)"**, browser akan melempar error:
`TypeError: onOpenAccountInfo is not a function`

---

### 🛠️ Langkah Perbaikan (Pilih Salah Satu Opsi):

#### Opsi A: Perbaiki di `frontend/src/App.jsx` (Direkomendasikan)
Buka file `frontend/src/App.jsx`, cari bagian pemanggilan `<Navbar ... />` (sekitar baris 225-233), lalu sesuaikan nama props:

```jsx
// SEBELUM:
<Navbar
  darkMode={darkMode}
  setDarkMode={setDarkMode}
  onLoginClick={() => setShowLogin(true)}
  currentUser={currentUser}
  onOpenAccount={() => setShowAccount(true)}
  onOpenMyBookings={() => setShowMyBookings(true)}
  onOpenLogout={() => setShowLogout(true)}
/>

// SESUDAH (PERBAIKAN):
<Navbar
  darkMode={darkMode}
  setDarkMode={setDarkMode}
  onLoginClick={() => setShowLogin(true)}
  currentUser={currentUser}
  onOpenAccountInfo={() => setShowAccount(true)}
  onOpenMyBookings={() => setShowMyBookings(true)}
  onOpenLogoutConfirm={() => setShowLogout(true)}
/>
```

---

## 3. PERBAIKAN 2: IMPLEMENTASI ENDPOINT BOOKING DI BACKEND

### 🔍 Penyebab Masalah:
Komponen `BookingSection.jsx` dan `App.jsx` membutuhkan dua endpoint:
1. `GET /api/bookings?date=YYYY-MM-DD` : Mengambil daftar jadwal yang sudah terisi pada tanggal tersebut.
2. `POST /api/bookings` : Menerima reservasi baru dan memvalidasi apakah jam tersebut sudah diambil orang lain atau belum.

Saat ini kedua endpoint tersebut **belum ditulis** di `backend/index.mjs`.

---

### 🛠️ Kode yang Perlu Ditambahkan ke `backend/index.mjs`:
Tambahkan blok kode berikut di file `backend/index.mjs` (letakkan sebelum fungsi `app.listen`):

```javascript
// ==========================================
// 7. AMBIL DAFTAR BOOKING BERDASARKAN TANGGAL
// ==========================================
app.get("/api/bookings", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Parameter tanggal (date) wajib disertakan." });
    }

    const [bookings] = await db.query(
      "SELECT id, customer_name, phone_number, booking_date, start_time, end_time, status FROM bookings WHERE booking_date = ? AND status != 'CANCELLED'",
      [date]
    );

    return res.json(bookings);
  } catch (error) {
    console.error("Error Get Bookings by Date:", error);
    return res.status(500).json({ message: "Gagal mengambil data jadwal pemesanan." });
  }
});

// ==========================================
// 8. BUAT RESERVASI BARU
// ==========================================
app.post("/api/bookings", async (req, res) => {
  try {
    const { customer_name, phone_number, booking_date, start_time, end_time } = req.body;

    // 1. Validasi kelengkapan data
    if (!customer_name || !phone_number || !booking_date || !start_time || !end_time) {
      return res.status(400).json({ message: "Semua kolom reservasi wajib diisi." });
    }

    // 2. Cek apakah ada jadwal yang bertabrakan (overlapping)
    // Rumus overlap: (JadwalMulai < BaruSelesai) AND (JadwalSelesai > BaruMulai)
    const [existing] = await db.query(
      `SELECT id FROM bookings 
       WHERE booking_date = ? 
         AND status != 'CANCELLED'
         AND (start_time < ? AND end_time > ?)`,
      [booking_date, end_time, start_time]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Slot jam tersebut sudah dipesan oleh orang lain. Silakan pilih jam lain.",
      });
    }

    // 3. Simpan data reservasi baru dengan status PENDING (Menunggu Pembayaran DP)
    await db.query(
      `INSERT INTO bookings (customer_name, phone_number, booking_date, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [customer_name, phone_number, booking_date, start_time, end_time]
    );

    return res.status(201).json({
      message: "Reservasi berhasil dibuat! Silakan hubungi admin untuk konfirmasi pembayaran DP.",
    });
  } catch (error) {
    console.error("Error Create Booking:", error);
    return res.status(500).json({ message: "Terjadi kesalahan saat memproses reservasi." });
  }
});
```

---

## 4. PERBAIKAN 3: RESTRUKTURISASI `app.listen` & PEMBERSIHAN FILE REDUNDAN

### 🔍 Analisis Kode Backend Saat Ini:
Di baris 265-289 `backend/index.mjs`:
```javascript
app.listen(PORT, () => {
  console.log(`Server backend aktif di http://localhost:${PORT}`);
});

// ==========================================
// 6. AMBIL RIWAYAT BOOKING PENGUNJUNG
// ==========================================
app.get("/api/my-bookings", async (req, res) => {
  // ...
});
```
* **Masalah:** Fungsi `app.listen(...)` harus selalu berada di **bagian paling bawah file**, setelah semua definisi rute dan middleware terdaftar.
* **File Redundan:** File `backend/index1.mjs` adalah duplikasi dari fungsi *update-profile* tanpa server listener. File ini bisa dihapus agar repository tetap rapi.
* **Dependensi `package.json`:** Pada `backend/package.json` ada `"bcrypt": "^6.0.0"` dan `"bcryptjs": "^3.0.3"`. Karena di kode menggunakan `import bcrypt from "bcryptjs"`, maka paket `bcrypt` yang bergantung pada Python/C++ compiler bisa di-uninstall:
  ```powershell
  cd backend
  npm uninstall bcrypt
  ```

---

## 5. PERBAIKAN 4: PENGAMANAN ENDPOINT & MIDDLEWARE OTORISASI JWT

### 🔍 Potensi Celah:
Saat ini:
1. `GET /api/my-bookings?phone_number=08123456789`: Siapa pun yang menebak nomor HP dapat membaca riwayat pemesanan pelanggan lain tanpa token login.
2. `PUT /api/auth/update-profile`: Mengirim `id` di dalam body. User yang cerdik bisa mengubah ID user lain untuk mengganti kata sandi atau nama akun orang lain (*Insecure Direct Object Reference*).

### 🛠️ Solusi Middleware JWT (Rekomendasi untuk Tahap Lanjutan):
Buat middleware otentikasi di `backend/index.mjs`:

```javascript
// Middleware verifikasi JWT Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Akses ditolak. Token tidak ditemukan." });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ message: "Token sesi tidak valid atau sudah kedaluwarsa." });
    }
    req.user = decodedUser;
    next();
  });
};
```

Gunakan pada endpoint sensitif:
```javascript
// Contoh pemakaian:
app.get("/api/my-bookings", authenticateToken, async (req, res) => {
  // Mengambil data berdasarkan req.user.id yang dienkripsi di dalam token, bukan query string
});
```

---

## 6. PERBAIKAN 5: PEMBERSIHAN TEKS PLACEHOLDER LOREM IPSUM

Pada file `frontend/src/components/Features.jsx` (baris 54-71), deskripsi pada `supportingFacilities` masih berisi teks *Lorem Ipsum*:
* *Toilet & Ruang Bilas*
* *Shower Air Hangat*
* *Loker Pengaman*
* *Kantin & Rest Area*
* *Mushola Nyaman*

### 🛠️ Rekomendasi Teks Pengganti yang Relevan:
```javascript
  const supportingFacilities = [
    {
      name: "Toilet & Ruang Bilas",
      desc: "Fasilitas sanitasi yang higienis dan terawat secara berkala untuk kenyamanan seluruh pemain seusai berolahraga.",
    },
    {
      name: "Shower Air Hangat",
      desc: "Nikmati pancuran air hangat yang bersih untuk memulihkan kesegaran tubuh setelah sesi latihan yang intensif.",
    },
    {
      name: "Loker Pengaman",
      desc: "Penyimpanan barang bawaan yang aman dengan kunci personal selama Anda beraktivitas di arena olahraga.",
    },
    {
      name: "Kantin & Rest Area",
      desc: "Area santai yang menyediakan aneka minuman isotonik dingin, makanan ringan, dan tempat duduk yang nyaman bagi pendukung.",
    },
    {
      name: "Mushola Nyaman",
      desc: "Tempat ibadah yang tenang, bersih, dan dilengkapi perlengkapan sholat lengkap untuk kemudahan beribadah tepat waktu.",
    },
  ];
```

---

## 7. CHECKLIST PENGUJIAN PASCA PERBAIKAN

Setelah melakukan langkah-langkah di atas nanti, uji sistem dengan urutan berikut:

1. [ ] **Test Dropdown Profil:** Login sebagai user, klik nama profil di Navbar, lalu klik **"Info Akun"** -> Pastikan modal akun terbuka tanpa error di console browser.
2. [ ] **Test Logout:** Klik menu **"Keluar (Logout)"** di Navbar -> Pastikan modal konfirmasi muncul dan sesi terhapus saat dikonfirmasi.
3. [ ] **Test Pemuatan Jadwal:** Buka form reservasi lapangan, ubah tanggal -> Pastikan tidak ada pesan error `404` pada network browser dan slot warna hijau/merah tampil sesuai data database.
4. [ ] **Test Pembuatan Booking:** Lakukan reservasi untuk slot tertentu (misal: pukul 16:00 - 18:00) -> Pastikan data tersimpan ke tabel `bookings` dan jam tersebut berubah status menjadi terisi.
5. [ ] **Test Deteksi Bentrok Jam:** Coba lakukan reservasi ulang pada tanggal dan rentang jam yang sama -> Sistem harus menolak dengan notifikasi *"Slot jam tersebut sudah dipesan"*.
6. [ ] **Test Riwayat Pemesanan:** Buka menu **"Riwayat Booking"** di Navbar -> Pastikan pemesanan yang baru saja dibuat tercantum dengan status "MENUNGGU".

