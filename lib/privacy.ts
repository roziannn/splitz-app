export const PRIVACY_UPDATED = '14 Oktober 2026';

/** Isi alamat email pengembang agar tampil di kebijakan; kosong = baris kontak tidak ditampilkan di aplikasi. */
export const PRIVACY_CONTACT = '';

export interface PrivacySection {
  title: string;
  body: string[];
}

export const PRIVACY_INTRO =
  'Splitz adalah aplikasi pencatat pengeluaran dan pembagi tagihan. Data Anda tersimpan di perangkat Anda sendiri. Kami tidak punya server untuk menampung data Anda, tidak ada akun, tidak ada iklan, dan tidak ada pelacak.';

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    title: 'Data yang disimpan',
    body: [
      'Catatan pengeluaran: nama toko, tanggal, item, harga, pajak, kategori, dan hasil split bill.',
      'Nama anggota keluarga dan peserta split yang Anda ketik sendiri.',
      'Pengaturan aplikasi (tema, mode, kategori buatan sendiri) dan ringkasan tutup buku.',
      'Foto struk yang Anda ambil atau pilih, disimpan dalam bentuk terkompres.',
      'Semua itu berada di penyimpanan privat aplikasi di HP Anda dan terhapus saat aplikasi dicopot atau datanya dibersihkan.',
    ],
  },
  {
    title: 'Kamera dan foto',
    body: [
      'Izin kamera hanya dipakai saat Anda memotret struk.',
      'Teks pada struk dibaca langsung di HP dengan Google ML Kit. Foto tidak diunggah ke mana pun.',
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
    title: 'Pihak ketiga',
    body: ['Google ML Kit (membaca teks di perangkat) dan Expo (pembaruan aplikasi). Tidak ada layanan iklan atau analitik.'],
  },
  {
    title: 'Keamanan',
    body: [
      'Data berada di penyimpanan privat aplikasi yang dilindungi sistem Android. Kami menyarankan memakai kunci layar di HP Anda.',
      'File ekspor yang Anda simpan atau bagikan tidak terenkripsi; simpan di tempat yang aman.',
    ],
  },
  {
    title: 'Kendali Anda',
    body: [
      'Anda bisa melihat, mengubah, dan menghapus semua catatan kapan saja di dalam aplikasi, dan mengekspornya ke Excel atau PDF.',
      'Menghapus aplikasi atau membersihkan datanya menghapus seluruh data yang tersimpan.',
    ],
  },
  {
    title: 'Anak-anak',
    body: ['Splitz tidak mengumpulkan data dari siapa pun, termasuk anak-anak.'],
  },
  {
    title: 'Perubahan kebijakan',
    body: ['Jika kebijakan ini berubah, tanggal pembaruan di atas ikut diubah dan versi terbaru tersedia di halaman ini.'],
  },
];
