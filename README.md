# Splitz — Scan Struk & Split Bill (Android / Expo)

Versi mobile dari receip.tic: foto struk, AI mengekstrak item, harga, pajak, mengkategorikan pengeluaran, menyusun laporan harian, dan membagi tagihan (split bill) per orang.

## Menjalankan (Expo)
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

## Build APK
```bash
npx eas build -p android --profile preview
```

Catatan: ikon/splash belum disertakan; tambahkan `icon`, `splash.image`, dan `android.adaptiveIcon` di app.json bila diperlukan.
