import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

/** Kategori untuk input manual (grid ikon). Delapan pertama sama dengan kategori hasil scan. */
export const MANUAL_CATEGORIES: { name: string; icon: IconName; color: string }[] = [
  { name: 'Makanan', icon: 'restaurant-outline', color: '#2a78d6' },
  { name: 'Minuman', icon: 'cafe-outline', color: '#eb6834' },
  { name: 'Makanan ringan', icon: 'ice-cream-outline', color: '#c2410c' },
  { name: 'Belanja', icon: 'cart-outline', color: '#1baf7a' },
  { name: 'Transportasi', icon: 'bus-outline', color: '#eda100' },
  { name: 'Mobil', icon: 'car-outline', color: '#0e7490' },
  { name: 'Bepergian', icon: 'airplane-outline', color: '#0369a1' },
  { name: 'Pakaian', icon: 'shirt-outline', color: '#be185d' },
  { name: 'Elektronik', icon: 'desktop-outline', color: '#475569' },
  { name: 'Kesehatan', icon: 'heart-outline', color: '#e87ba4' },
  { name: 'Olahraga', icon: 'barbell-outline', color: '#15803d' },
  { name: 'Hiburan', icon: 'game-controller-outline', color: '#008300' },
  { name: 'Tagihan', icon: 'receipt-outline', color: '#6250d6' },
  { name: 'Rumah', icon: 'home-outline', color: '#a16207' },
  { name: 'Perbaikan', icon: 'construct-outline', color: '#b45309' },
  { name: 'Peliharaan', icon: 'paw-outline', color: '#9a3412' },
  { name: 'Pendidikan', icon: 'school-outline', color: '#4338ca' },
  { name: 'Hadiah', icon: 'gift-outline', color: '#db2777' },
  { name: 'Donasi', icon: 'heart-circle-outline', color: '#dc2626' },
  { name: 'Lainnya', icon: 'ellipsis-horizontal-circle-outline', color: '#8a8a85' },
];

export const categoryColor = (name: string) => MANUAL_CATEGORIES.find((c) => c.name === name)?.color;
