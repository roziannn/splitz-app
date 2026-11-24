# Splitz — Scan Struk & Split Bill (Android / Expo)

Versi mobile dari receip.tic: foto struk, teks dibaca di HP (Google ML Kit, tanpa API key), item/harga/pajak diekstrak dan dikategorikan, laporan harian, dan split bill per orang.

## Fitur
- **Scan**: kamera/galeri → OCR di HP → toko, tanggal, item, qty, harga, pajak, service, diskon, kategori
- **Edit**: koreksi hasil OCR, tambah/hapus item, ubah kategori
- **Split bill**: tambah peserta, tentukan siapa makan apa (item bisa dibagi beberapa orang), pajak/service/diskon dibagi proporsional, bagikan hasil
- **Laporan**: total per hari, per kategori (hari ini / 7 / 30 hari)
- **Perbarui sekarang**: tombol di tab Pengaturan (OTA via EAS Update)
- Data struk tersimpan lokal (AsyncStorage), dengan antrean sinkronisasi akun saat online
- Login/register; API Vercel menyimpan akun dan salinan struk di Neon

## Build APK (EAS)
```bash
npm install
npx eas-cli login
npx eas-cli build -p android --profile production
```
Terminal menampilkan link dan QR untuk mengunduh APK setelah build selesai.

Scan struk memakai modul native, jadi **tidak jalan di Expo Go**; pakai APK hasil build.

## Menyiapkan login dan sinkronisasi cloud

Ikuti [panduan Neon + Vercel](docs/sinkronisasi-neon-vercel.md). Sebelum build APK, atur `EXPO_PUBLIC_API_URL` ke URL backend Vercel di environment build EAS. Kredensial `DATABASE_URL` dan `AUTH_SECRET` hanya disimpan di environment backend Vercel.

## Merilis pembaruan
- Perubahan kode/tampilan (JavaScript saja):
  ```bash
  npx eas-cli update --branch production --message "deskripsi"
  ```
  Di HP: Pengaturan → **Perbarui sekarang**.
- Perubahan native (library baru, `app.json`): naikkan `version` di `app.json` lalu build APK baru.

Tidak ada GitHub Actions; build dan update dijalankan dari terminal.

Catatan: ikon/splash belum disertakan; tambahkan `icon`, `splash.image`, dan `android.adaptiveIcon` di app.json bila diperlukan.
