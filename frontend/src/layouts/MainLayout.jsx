import React from "react";

export default function MainLayout({ children }) {
  return (
    <div className="app-container">
      {/* Navbar Sementara / Global */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="font-bold text-xl">Aplikasi Saya</h1>
        <nav>{/* Tautan navigasi bisa ditaruh di sini nanti */}</nav>
      </header>

      {/* Konten Utama Halaman */}
      <main className="p-6 min-h-screen bg-gray-50">{children}</main>

      {/* Footer Sederhana */}
      <footer className="bg-gray-800 text-white text-center p-4 text-sm">
        &copy; 2026 Aplikasi Anda. All rights reserved.
      </footer>
    </div>
  );
}
