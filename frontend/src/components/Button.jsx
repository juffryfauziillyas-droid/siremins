import React from "react";

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
}) {
  // Menyesuaikan warna tombol berdasarkan tipe/varian
  const baseStyle = "px-4 py-2 rounded font-medium transition duration-200";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant] || variants.primary}`}
    >
      {children}
    </button>
  );
}
