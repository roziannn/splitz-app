# Splitz API (Vercel)

Atur **Root Directory** proyek Vercel ke `backend`, lalu tambahkan environment variables:

- `DATABASE_URL`: connection string Neon dengan SSL.
- `AUTH_SECRET`: rahasia acak panjang untuk menandatangani token sesi (minimal 32 byte).

Jalankan [`migrations/001_initial_schema.sql`](migrations/001_initial_schema.sql) sekali melalui Neon SQL Editor. API juga memastikan tabel `app_users` dan `user_receipts` tersedia saat permintaan pertama. Endpoint:

- `POST /api/auth/register` — `{ "email", "password" }`
- `POST /api/auth/login` — `{ "email", "password" }`
- `POST /api/sync` — bearer token, `{ "changes": [...] }`

Skema mencakup preferensi, rekening, anggota keluarga, kategori buatan, dan tutup buku untuk sinkronisasi berikutnya. Versi aplikasi saat ini baru memakai `app_users` dan `user_receipts`; tabel fitur lain belum ditulis/dibaca oleh endpoint sync.

Sebelum build aplikasi, set `EXPO_PUBLIC_API_URL` ke URL deployment Vercel (contoh `https://splitz-api.vercel.app`). Nilai ini bukan rahasia; jangan pernah menaruh `DATABASE_URL` atau `AUTH_SECRET` di variabel `EXPO_PUBLIC_*`.
