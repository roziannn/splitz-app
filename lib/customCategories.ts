import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo, useSyncExternalStore } from 'react';
import { MANUAL_CATEGORIES } from './categories';
import { IconName } from './iconChoices';
import { CAT_COLOR } from './theme';

export interface Cat {
  name: string;
  icon: IconName;
  color: string;
}

const KEY = 'splitz.categories.v1';
export const MAX_NAME = 20;

let custom: Cat[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Warna kategori dipakai di banyak tempat lewat CAT_COLOR, jadi kategori buatan sendiri didaftarkan ke sana.
const paint = (list: Cat[]) => list.forEach((c) => { CAT_COLOR[c.name] = c.color; });
const persist = () => AsyncStorage.setItem(KEY, JSON.stringify(custom)).catch(() => {});

const valid = (c: any): c is Cat => c && typeof c.name === 'string' && typeof c.icon === 'string' && typeof c.color === 'string';

// Muat sekali saat aplikasi dibuka; gabungkan dengan perubahan yang terjadi sebelum selesai dimuat.
AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (!raw) return;
    const saved = (JSON.parse(raw) as unknown[]).filter(valid);
    custom = [...saved, ...custom.filter((c) => !saved.some((s) => s.name === c.name))];
    paint(custom);
    emit();
  })
  .catch(() => {});

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

/** Daftar kategori buatan sendiri; komponen ikut diperbarui saat ada perubahan. */
export const useCustomCategories = () => useSyncExternalStore(subscribe, () => custom);

/** Semua kategori: bawaan lalu buatan sendiri. */
export function useAllCategories(): Cat[] {
  const mine = useCustomCategories();
  return useMemo(() => [...MANUAL_CATEGORIES, ...mine], [mine]);
}

const taken = (name: string) =>
  [...MANUAL_CATEGORIES, ...custom].some((c) => c.name.toLowerCase() === name.trim().toLowerCase());

/** Tambah kategori. Mengembalikan pesan kesalahan, atau null jika berhasil. */
export function addCategory(c: Cat): string | null {
  const name = c.name.trim();
  if (!name) return 'Nama kategori belum diisi.';
  if (name.length > MAX_NAME) return `Nama maksimal ${MAX_NAME} huruf.`;
  if (taken(name)) return 'Nama kategori sudah ada.';
  custom = [...custom, { ...c, name }];
  paint([custom[custom.length - 1]]);
  persist();
  emit();
  return null;
}

/** Hapus kategori buatan sendiri. Catatan lama tetap memakai namanya. */
export function removeCategory(name: string) {
  custom = custom.filter((c) => c.name !== name);
  persist();
  emit();
}

export const isCustom = (name: string) => custom.some((c) => c.name === name);
