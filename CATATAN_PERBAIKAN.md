# Catatan konfigurasi lokal

Simpan seluruh kredensial hanya pada `backend/.env` lokal. Jangan menaruh nilai
secret, password, token, atau kredensial database di dokumentasi, issue, maupun
file yang dilacak Git.

Untuk membuat secret JWT acak di PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Pastikan `JWT_SECRET` pada `backend/.env` memiliki minimal 32 karakter. Jika
secret diganti, restart backend dan login kembali karena token lama tidak lagi
berlaku. Rotasi semua kredensial yang pernah tercantum di catatan lama.
