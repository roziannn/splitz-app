import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const KEY = 'splitz.onboarded.v1';

// null = belum selesai dibaca dari penyimpanan
let seen: boolean | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

AsyncStorage.getItem(KEY)
  .then((v) => { seen = seen === true ? true : v === '1'; emit(); })
  .catch(() => { seen = true; emit(); }); // jika penyimpanan gagal, jangan menahan pengguna di panduan

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

/** null = memuat, false = belum pernah melihat panduan, true = sudah. */
export const useOnboarded = () => useSyncExternalStore(subscribe, () => seen);

export function markOnboarded() {
  seen = true;
  AsyncStorage.setItem(KEY, '1').catch(() => {});
  emit();
}
