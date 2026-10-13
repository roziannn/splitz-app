import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { uid } from './format';
import { Person } from './types';

export type AppMode = 'pribadi' | 'keluarga';
export interface FamilyState {
  mode: AppMode;
  members: Person[];
}

const KEY = 'splitz.family.v1';
export const MAX_NAME = 20;

let state: FamilyState = { mode: 'pribadi', members: [] };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const persist = () => AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
const set = (next: FamilyState) => {
  state = next;
  persist();
  emit();
};

// Muat sekali saat aplikasi dibuka.
AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (!raw) return;
    const s = JSON.parse(raw);
    const members = Array.isArray(s?.members) ? s.members.filter((m: any) => m && typeof m.id === 'string' && typeof m.name === 'string') : [];
    state = { mode: s?.mode === 'keluarga' ? 'keluarga' : 'pribadi', members: [...members, ...state.members.filter((m) => !members.some((x: Person) => x.id === m.id))] };
    emit();
  })
  .catch(() => {});

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

export const useFamily = () => useSyncExternalStore(subscribe, () => state);

export const setAppMode = (mode: AppMode) => set({ ...state, mode });

/** Tambah anggota. Mengembalikan pesan kesalahan, atau null jika berhasil. */
export function addMember(raw: string): string | null {
  const name = raw.trim();
  if (!name) return 'Nama belum diisi.';
  if (name.length > MAX_NAME) return `Nama maksimal ${MAX_NAME} huruf.`;
  if (state.members.some((m) => m.name.toLowerCase() === name.toLowerCase())) return 'Nama sudah ada.';
  set({ ...state, members: [...state.members, { id: uid(), name }] });
  return null;
}

export const removeMember = (id: string) => set({ ...state, members: state.members.filter((m) => m.id !== id) });
