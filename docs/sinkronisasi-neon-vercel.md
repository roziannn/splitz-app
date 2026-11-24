# Login dan sinkronisasi cloud

Splitz menyimpan data tetap di perangkat dan mengantre perubahan struk secara lokal. Saat perangkat online, antrean dikirim ke Vercel API dan disimpan per akun di Neon. Token login disimpan dengan Expo SecureStore. Foto struk tetap berada di perangkat.

## Menyiapkan backend

1. Buat database Neon dan salin connection string.
2. Impor repository ke Vercel dengan **Root Directory** `backend`.
3. Tambahkan `DATABASE_URL` dan `AUTH_SECRET` pada Environment Variables Vercel. Buat secret acak kuat, misalnya dengan `openssl rand -base64 48`.
4. Deploy. Tabel akun dan struk dibuat otomatis saat endpoint pertama kali dipanggil.
5. Atur `EXPO_PUBLIC_API_URL` ke URL deployment Vercel, lalu build ulang APK. Jangan gunakan alamat localhost pada APK yang dipasang di HP.

Endpoint register dan login mengembalikan bearer token bertanda tangan yang berlaku 30 hari. Password disimpan sebagai hash scrypt. Endpoint sync melakukan upsert berdasarkan akun dan ID struk serta mempertahankan perubahan offline dalam antrean lokal.

## Batasan versi awal

- Sinkronisasi hanya untuk struk. Rekening, kategori, mode keluarga, dan tutup buku masih lokal.
- Foto struk tidak diunggah. Perangkat lain mendapat data struk tanpa foto.
- Konflik untuk struk yang sama dimenangkan perubahan dengan waktu update terbaru.
- Data lama pada perangkat pertama kali diunggah ke akun pertama yang digunakan. Saat berganti akun, data akun sebelumnya tidak ikut dikirim ke akun baru.
- Penghapusan akun/data cloud belum tersedia dari aplikasi; siapkan proses penghapusan sebelum membuka pendaftaran untuk pengguna umum.
