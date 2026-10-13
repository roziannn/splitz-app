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
  primary: '#0f766e',
  primaryDark: '#115e59',
  primarySoft: '#ccfbf1',
  accent: '#0f766e',
  bg: '#f5f7f7',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  danger: '#dc2626',
  warn: '#f59e0b',
  inputBg: '#ffffff',
  chipBg: '#ececef',
  chipIcon: '#3f3f46',
  keypadBg: '#e9eaee',
  key: '#ffffff',
  keyDisabled: '#b9bbc2',
  overlay: 'rgba(15,23,42,0.45)',
  placeholder: '#a1a1aa',
  snackBg: '#0f172a',
  snackText: '#ffffff',
  snackAction: '#5eead4',
};

export const DARK: Palette = {
  dark: true,
  primary: '#0f766e',
  primaryDark: '#115e59',
  primarySoft: '#134e4a',
  accent: '#2dd4bf',
  bg: '#0e1415',
  card: '#172022',
  text: '#e6eef0',
  muted: '#8fa3a8',
  border: '#27363a',
  danger: '#f87171',
  warn: '#fbbf24',
  inputBg: '#101a1c',
  chipBg: '#243134',
  chipIcon: '#c7d4d7',
  keypadBg: '#111a1c',
  key: '#1f2c2f',
  keyDisabled: '#3a4a4d',
  overlay: 'rgba(0,0,0,0.65)',
  placeholder: '#6b7f84',
  snackBg: '#e6eef0',
  snackText: '#0f172a',
  snackAction: '#0f766e',
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
export const SERIES = '#2a78d6';
