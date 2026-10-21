import mysql from "mysql2/promise"; 
import "dotenv/config"; 

// koneksi ke database dari .env
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

//  tes koneksi 
try {
  const connection = await db.getConnection();
  console.log("Berhasil terhubung ke database !");
  connection.release(); // Kembalikan koneksi ke pool
} catch (error) {
  console.error("Gagal terhubung ke database:", error.message);
}

export default db;
