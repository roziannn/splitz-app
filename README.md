# Splitz — Scan Struk & Split Bill (Android / Expo)

Versi mobile dari receip.tic: foto struk, AI mengekstrak item, harga, pajak, mengkategorikan pengeluaran, menyusun laporan harian, dan membagi tagihan (split bill) per orang.

## Download (Android)

Scan QR ini dari HP Android, atau buka link di bawahnya, lalu pasang APK-nya:

<img src="docs/qr-download.svg" width="220" alt="QR download Splitz" />

https://github.com/roziannn/splitz-app/releases/latest/download/Splitz.apk

Setelah terpasang, buka tab **Pengaturan** untuk mengisi API key dan memakai tombol **Cek pembaruan**.

## Menjalankan untuk pengembangan (Expo)
```bash
npm install
npx expo start        # scan QR dengan Expo Go di Android
```

## Pengaturan
Buka tab **Pengaturan** dan isi Anthropic API key (disimpan di SecureStore perangkat). Key dipakai untuk OCR struk via Claude vision.

## Fitur
- **Scan**: kamera/galeri → AI mengekstrak toko, tanggal, item, pajak, service, diskon, kategori
- **Edit**: koreksi hasil OCR, tambah/hapus item, ubah kategori
- **Split bill**: tambah peserta, tentukan siapa makan apa (item bisa dibagi beberapa orang), pajak/service/diskon dibagi proporsional, bagikan hasil
- **Laporan**: total per hari, per kategori (hari ini / 7 / 30 hari)
- Data tersimpan lokal (AsyncStorage)
- **Pembaruan**: tombol Cek pembaruan membaca GitHub Releases

## Merilis versi baru
1. Naikkan `version` di `app.json`, merge ke `main`.
2. Actions → Build APK → Run workflow. APK terbit di Releases sebagai `Splitz.apk`.

Catatan: ikon/splash belum disertakan; tambahkan `icon`, `splash.image`, dan `android.adaptiveIcon` di app.json bila diperlukan.
