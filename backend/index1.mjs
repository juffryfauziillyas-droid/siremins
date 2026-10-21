import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs"; // Hapus impor bcrypt lama jika masih ada

const app = express();

// 2. Baru gunakan middleware atau route setelahnya
app.use(cors());
app.use(express.json());
// ==========================================
// UPDATE PROFIL PENGUNJUNG (NAMA & PASSWORD)
// ==========================================
app.put("/api/auth/update-profile", async (req, res) => {
  try {
    const { id, name, currentPassword, newPassword } = req.body;

    if (!id || !name) {
      return res
        .status(400)
        .json({ message: "ID pengguna dan nama wajib diisi." });
    }

    // Ambil data user dari database
    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    const user = users[0];

    // Jika pengguna ingin mengganti kata sandi
    if (newPassword && newPassword.trim() !== "") {
      if (!currentPassword) {
        return res.status(400).json({
          message:
            "Kata sandi saat ini wajib diisi untuk mengganti kata sandi.",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Kata sandi saat ini tidak cocok/salah." });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await db.query("UPDATE users SET name = ?, password = ? WHERE id = ?", [
        name,
        hashedNewPassword,
        id,
      ]);
    } else {
      // Hanya update nama
      await db.query("UPDATE users SET name = ? WHERE id = ?", [name, id]);
    }

    // Ambil data user terbaru untuk dikembalikan ke frontend
    const [updatedUsers] = await db.query(
      "SELECT id, name, email, phone_number, role FROM users WHERE id = ?",
      [id],
    );

    return res.json({
      message: "Profil berhasil diperbarui!",
      user: updatedUsers[0],
    });
  } catch (error) {
    console.error("Error Update Profile:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
});
