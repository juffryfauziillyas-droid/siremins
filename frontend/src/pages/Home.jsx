import React from "react";
import MainLayout from "../layouts/MainLayout";
import Button from "../components/Button";

export default function Home() {
  return (
    <MainLayout>
      <div className="max-w-xl mx-auto text-center py-12">
        <h2 className="text-3xl font-bold mb-4">Selamat Datang Kembali!</h2>
        <p className="text-gray-600 mb-6">
          Frontend Anda kini ditata ulang dengan bersih, modular, dan siap
          dihubungkan ke backend.
        </p>
        <Button onClick={() => alert("Tombol diklik!")} variant="primary">
          Mulai Eksplorasi
        </Button>
      </div>
    </MainLayout>
  );
}
