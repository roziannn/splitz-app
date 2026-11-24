export const PRIVACY_UPDATED = '24 November 2026';

/** Isi alamat email pengembang agar tampil di kebijakan; kosong = baris kontak tidak ditampilkan di aplikasi. */
export const PRIVACY_CONTACT = '';

export interface PrivacySection {
  title: string;
  body: string[];
}

export const PRIVACY_INTRO =
  'Splitz adalah aplikasi pencatat pengeluaran dan pembagi tagihan. Untuk memakai sinkronisasi antar perangkat, Anda dapat membuat akun. Data struk tetap tersimpan di perangkat dan disalin ke server Vercel dan database Neon yang dikonfigurasi oleh pengelola aplikasi. Tidak ada iklan atau pelacak.';

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    title: 'Data yang disimpan',
    body: [
      'Catatan pengeluaran: nama toko, tanggal, item, harga, pajak, kategori, dan hasil split bill.',
      'Nama anggota keluarga dan peserta split yang Anda ketik sendiri.',
      'Pengaturan aplikasi (tema, mode, kategori buatan sendiri) dan ringkasan tutup buku.',
      'Pilihan pengingat pengeluaran disimpan lokal di perangkat.',
      'Foto struk yang Anda ambil atau pilih, disimpan dalam bentuk terkompres.',
      'Catatan struk disimpan di HP dan disinkronkan ke akun Anda saat online. Foto struk tidak diunggah.',
      'Email dan hash kata sandi digunakan untuk membuat dan mengamankan akun. Kata sandi asli tidak disimpan.',
      'Pengaturan aplikasi lain tetap berada di HP dan tidak ikut disinkronkan.',
    ],
  },
  {
    title: 'Kamera dan foto',
    body: [
      'Izin kamera hanya dipakai saat Anda memotret struk.',
      'Teks pada struk dibaca langsung di HP dengan Google ML Kit. Foto tidak diunggah ke server.',
      'Dari galeri, aplikasi hanya membaca foto yang Anda pilih.',
    ],
  },
  {
    title: 'Ekspor, bagikan, dan impor',
    body: [
      'File Excel, PDF, dan teks split bill hanya dibuat saat Anda memintanya, lalu dikirim ke tujuan yang Anda pilih. Kami tidak menerima salinannya.',
      'Setelah dibagikan, pengelolaan data oleh aplikasi tujuan mengikuti kebijakan aplikasi itu.',
      'Impor hanya membaca file yang Anda pilih dari folder yang Anda izinkan.',
    ],
  },
  {
    title: 'Pembaruan aplikasi',
    body: [
      'Saat Anda menekan "Perbarui sekarang", aplikasi memeriksa dan mengunduh pembaruan kode lewat layanan Expo Updates.',
      'Permintaan itu memuat informasi teknis standar seperti versi aplikasi, platform, dan alamat IP. Catatan pengeluaran Anda tidak ikut terkirim.',
    ],
  },
  {
    title: 'Pengingat pengeluaran',
    body: [
      'Jika diaktifkan, aplikasi memeriksa catatan di perangkat dan menampilkan notifikasi lokal bila belum ada pengeluaran hari ini.',
      'Pemeriksaan berjalan di perangkat. Jadwal background dapat ditunda oleh sistem operasi dan tidak dijamin tepat setiap enam jam.',
    ],
  },
  {
    title: 'Pihak ketiga',
    body: ['Google ML Kit (membaca teks di perangkat), Vercel (API), Neon (database), dan Expo (pembaruan aplikasi). Tidak ada layanan iklan atau analitik.'],
  },
  {
    title: 'Keamanan',
    body: [
      'Data lokal berada di penyimpanan privat aplikasi yang dilindungi sistem operasi. Token sesi disimpan menggunakan penyimpanan aman perangkat. Data akun dikirim melalui HTTPS; akses database hanya dilakukan oleh API server.',
      'File ekspor yang Anda simpan atau bagikan tidak terenkripsi; simpan di tempat yang aman.',
    ],
  },
  {
    title: 'Kendali Anda',
    body: [
      'Anda bisa melihat, mengubah, menghapus catatan di aplikasi, dan mengekspornya ke Excel atau PDF. Penghapusan akun dan salinan cloud perlu diminta melalui kontak pengelola.',
      'Menghapus aplikasi atau membersihkan datanya menghapus salinan lokal, tetapi tidak menghapus data cloud.',
    ],
  },
  {
    title: 'Anak-anak',
    body: ['Akun dibuat oleh pengguna. Jangan mendaftarkan akun untuk anak tanpa persetujuan wali.'],
  },
  {
    title: 'Perubahan kebijakan',
    body: ['Jika kebijakan ini berubah, tanggal pembaruan di atas ikut diubah dan versi terbaru tersedia di halaman ini.'],
  },
];
