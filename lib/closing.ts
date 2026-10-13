import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { buildFamilyReport } from './familyReport';
import { uid } from './format';
import { CatSlice, categoryTotals } from './report';
import { Person, Receipt } from './types';

/** Ringkasan satu periode yang sudah ditutup. Disimpan apa adanya, jadi angkanya tidak berubah lagi. */
export interface Closing {
  id: string;
  label: string; // mis. "Oktober 2026"
  from: string; // YYYY-MM-DD
  to: string;
  total: number;
  count: number;
  byCat: CatSlice[];
  byPerson: { name: string; amount: number }[]; // kosong jika bukan mode keluarga
  createdAt: number;
}

const KEY = 'splitz.closings.v1';

let closings: Closing[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const persist = () => AsyncStorage.setItem(KEY, JSON.stringify(closings)).catch(() => {});
const valid = (c: any): c is Closing => c && typeof c.id === 'string' && typeof c.from === 'string' && typeof c.to === 'string';

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (!raw) return;
    const saved = (JSON.parse(raw) as unknown[]).filter(valid);
    closings = [...closings, ...saved.filter((c) => !closings.some((x) => x.id === c.id))];
    emit();
  })
  .catch(() => {});

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

/** Periode yang sudah ditutup, terbaru dulu. */
export const useClosings = () => useSyncExternalStore(subscribe, () => closings);

/** Apakah tanggal ini masuk periode yang sudah ditutup? */
export const isClosedDate = (date: string, list: Closing[] = closings) => list.some((c) => date >= c.from && date <= c.to);

/** Ringkasan struk pada rentang tanggal; dipakai untuk pratinjau dan untuk disimpan saat tutup buku. */
export function summarize(receipts: Receipt[], from: string, to: string, members: Person[] = []) {
  const inRange = receipts.filter((r) => r.date >= from && r.date <= to);
  const { total, byCat } = categoryTotals(inRange);
  const fam = members.length ? buildFamilyReport(receipts, members, from, to) : null;
  return {
    count: inRange.length,
    total,
    byCat,
    byPerson: fam ? fam.perPerson.filter((p) => p.amount > 0).map((p) => ({ name: p.name, amount: p.amount })) : [],
  };
}

/** Tutup buku. Mengembalikan pesan kesalahan, atau null jika berhasil. */
export function closeBook(input: { label: string; from: string; to: string }, receipts: Receipt[], members: Person[]): string | null {
  const { from, to } = input;
  if (!from || !to) return 'Pilih tanggal mulai dan akhir.';
  if (to < from) return 'Tanggal akhir harus setelah tanggal mulai.';
  const clash = closings.find((c) => from <= c.to && to >= c.from);
  if (clash) return `Bertumpuk dengan periode "${clash.label}".`;
  const sum = summarize(receipts, from, to, members);
  if (!sum.count) return 'Tidak ada catatan pada periode ini.';
  const label = input.label.trim() || `${from} s/d ${to}`;
  closings = [{ id: uid(), label, from, to, createdAt: Date.now(), ...sum }, ...closings].sort((a, b) => b.from.localeCompare(a.from));
  persist();
  emit();
  return null;
}

/** Buka kembali: periode bisa diedit lagi. */
export function reopenBook(id: string) {
  closings = closings.filter((c) => c.id !== id);
  persist();
  emit();
}
