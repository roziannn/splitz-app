import { MANUAL_CATEGORIES } from './categories';

/** Token warna antarmuka. Dipakai lewat `useColors()` agar mengikuti mode terang/gelap. */
export interface Palette {
  dark: boolean;
  primary: string; // isian tombol/header/FAB (sama di kedua mode, teks di atasnya putih)
  primaryDark: string;
  primarySoft: string; // latar lembut bernuansa primer
  accent: string; // warna teks/ikon primer di atas permukaan (lebih terang di mode gelap)
  bg: string; // latar layar
  card: string; // permukaan kartu
  text: string;
  muted: string;
  border: string;
  danger: string;
  warn: string;
  inputBg: string; // latar kolom isian
  chipBg: string; // lingkaran/chip tidak aktif
  chipIcon: string;
  keypadBg: string;
  key: string;
  keyDisabled: string;
  overlay: string; // latar gelap di belakang lembar/modal
  placeholder: string;
  snackBg: string;
  snackText: string;
  snackAction: string;
}

export const LIGHT: Palette = {
  dark: false,
  primary: '#13865c',
  primaryDark: '#0d6545',
  primarySoft: '#dff5e9',
  accent: '#10764f',
  bg: '#f7f8fb',
  card: 'rgba(255,255,255,0.96)',
  text: '#17372a',
  muted: '#71867a',
  border: 'rgba(229,233,240,0.92)',
  danger: '#dc2626',
  warn: '#f59e0b',
  inputBg: 'rgba(255,255,255,0.96)',
  chipBg: '#f0f2f8',
  chipIcon: '#476653',
  keypadBg: '#eef0f5',
  key: 'rgba(255,255,255,0.94)',
  keyDisabled: '#c5d8ca',
  overlay: 'rgba(12,35,24,0.42)',
  placeholder: '#91a49a',
  snackBg: '#183b2c',
  snackText: '#ffffff',
  snackAction: '#8be0ad',
};

export const DARK: Palette = {
  dark: true,
  primary: '#16875e',
  primaryDark: '#0d6545',
  primarySoft: '#163d2d',
  accent: '#75dba4',
  bg: '#0e1912',
  card: 'rgba(24,39,29,0.94)',
  text: '#e8f2eb',
  muted: '#9aada0',
  border: 'rgba(151,190,160,0.16)',
  danger: '#f87171',
  warn: '#fbbf24',
  inputBg: 'rgba(10,24,15,0.72)',
  chipBg: '#203328',
  chipIcon: '#c7d4c9',
  keypadBg: '#111f16',
  key: 'rgba(35,52,40,0.94)',
  keyDisabled: '#3b4d40',
  overlay: 'rgba(0,0,0,0.65)',
  placeholder: '#758b7b',
  snackBg: '#e8f4eb',
  snackText: '#17372a',
  snackAction: '#10764f',
};

// Warna kategori: tetap per kategori (tidak berubah saat filter), divalidasi untuk buta warna.
// Urutan slot palet kategorikal; "Lainnya" memakai abu-abu netral.
export const CAT_COLOR: Record<string, string> = {
  ...Object.fromEntries(MANUAL_CATEGORIES.map((c) => [c.name, c.color])),
  Makanan: '#2a78d6',
  Minuman: '#eb6834',
  Belanja: '#1baf7a',
  Transportasi: '#eda100',
  Kesehatan: '#e87ba4',
  Hiburan: '#008300',
  Tagihan: '#6250d6',
  Lainnya: '#8a8a85',
};

/** Warna seri tunggal (garis tren). */
export const SERIES = '#13865c';
