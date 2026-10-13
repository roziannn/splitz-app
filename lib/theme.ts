import { MANUAL_CATEGORIES } from './categories';

export const C = {
  primary: '#0f766e',
  primaryDark: '#115e59',
  primarySoft: '#ccfbf1',
  bg: '#f5f7f7',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  danger: '#dc2626',
  warn: '#f59e0b',
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
