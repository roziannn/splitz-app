import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { uid } from './format';
import { receiptTotal } from './report';
import { Receipt } from './types';

export type AccountType = 'bank' | 'ewallet' | 'tunai';

export const ACCOUNT_TYPES: { key: AccountType; label: string; icon: 'business-outline' | 'phone-portrait-outline' | 'cash-outline' | 'card-outline' }[] = [
  { key: 'bank', label: 'Bank', icon: 'business-outline' },
  { key: 'ewallet', label: 'E-wallet', icon: 'phone-portrait-outline' },
  { key: 'tunai', label: 'Tunai', icon: 'cash-outline' },
];

export interface Provider {
  key: string;
  label: string;
  type: 'bank' | 'ewallet';
  bg: string; // warna latar logo
  fg: string; // warna tulisan logo
  mark: string; // tulisan pada logo
}

/** Pilihan bank dan e-wallet. Bank yang ada di BANK_LOGOS (lib/bankLogos.ts) tampil dengan logo SVG-nya; sisanya sebagai lencana berwarna merek. */
export const PROVIDERS: Provider[] = [
  { key: 'bca', label: 'BCA', type: 'bank', bg: '#0060AF', fg: '#FFFFFF', mark: 'BCA' },
  { key: 'mandiri', label: 'Mandiri', type: 'bank', bg: '#003D79', fg: '#FCB017', mark: 'mandiri' },
  { key: 'permata', label: 'Permata', type: 'bank', bg: '#0B8F4D', fg: '#FFFFFF', mark: 'permata' },
  { key: 'nobu', label: 'Nobu', type: 'bank', bg: '#B71C1C', fg: '#FFFFFF', mark: 'nobu' },
  { key: 'jago', label: 'Jago', type: 'bank', bg: '#FFC82C', fg: '#1F2937', mark: 'jago' },
  { key: 'seabank', label: 'SeaBank', type: 'bank', bg: '#F26B21', fg: '#FFFFFF', mark: 'SeaBank' },
  { key: 'bsi', label: 'BSI', type: 'bank', bg: '#00A39D', fg: '#FFFFFF', mark: 'BSI' },
  { key: 'btn', label: 'BTN', type: 'bank', bg: '#0069AB', fg: '#FFFFFF', mark: 'BTN' },
  { key: 'cimb', label: 'CIMB Niaga', type: 'bank', bg: '#790008', fg: '#FFFFFF', mark: 'CIMB' },
  { key: 'danamon', label: 'Danamon', type: 'bank', bg: '#F05A22', fg: '#FFFFFF', mark: 'Danamon' },
  { key: 'superbank', label: 'Superbank', type: 'bank', bg: '#012A31', fg: '#AFEE01', mark: 'Superbank' },
  { key: 'shopeepay', label: 'ShopeePay', type: 'ewallet', bg: '#EE4D2D', fg: '#FFFFFF', mark: 'ShopeePay' },
  { key: 'gopay', label: 'GoPay', type: 'ewallet', bg: '#00AED6', fg: '#FFFFFF', mark: 'gopay' },
  { key: 'ovo', label: 'OVO', type: 'ewallet', bg: '#4C3494', fg: '#FFFFFF', mark: 'OVO' },
];

export const providerInfo = (key?: string) => PROVIDERS.find((p) => p.key === key);

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  color: string;
  provider?: string; // kunci dari PROVIDERS; kosong = bank/e-wallet lain atau tunai
  initial: number; // saldo awal; saldo sekarang = saldo awal - pengeluaran yang dicatat dari rekening ini
}

const KEY = 'splitz.accounts.v1';
export const MAX_NAME = 24;

let accounts: Account[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const persist = () => AsyncStorage.setItem(KEY, JSON.stringify(accounts)).catch(() => {});
const valid = (a: any): a is Account => a && typeof a.id === 'string' && typeof a.name === 'string' && typeof a.type === 'string';

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (!raw) return;
    // Jenis "kredit" sudah dihapus; rekening lama dengan jenis itu dianggap bank.
    const saved = (JSON.parse(raw) as unknown[]).filter(valid).map((a) => ((a.type as string) === 'kredit' ? { ...a, type: 'bank' as const } : a));
    accounts = [...saved, ...accounts.filter((a) => !saved.some((s) => s.id === a.id))];
    emit();
  })
  .catch(() => {});

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

export const useAccounts = () => useSyncExternalStore(subscribe, () => accounts);

/** Simpan rekening baru atau perubahan. Mengembalikan pesan kesalahan, atau null jika berhasil. */
export function saveAccount(a: Omit<Account, 'id'> & { id?: string }): string | null {
  const name = a.name.trim();
  if (!name) return 'Nama belum diisi.';
  if (name.length > MAX_NAME) return `Nama maksimal ${MAX_NAME} huruf.`;
  if (accounts.some((x) => x.id !== a.id && x.name.toLowerCase() === name.toLowerCase())) return 'Nama sudah dipakai.';
  const next: Account = { ...a, name, id: a.id ?? uid() };
  accounts = a.id ? accounts.map((x) => (x.id === a.id ? next : x)) : [...accounts, next];
  persist();
  emit();
  return null;
}

/** Hapus rekening. Catatan lama tidak ikut terhapus; hanya tidak terhubung lagi ke rekening. */
export function removeAccount(id: string) {
  accounts = accounts.filter((a) => a.id !== id);
  persist();
  emit();
}

/** Total pengeluaran yang dicatat dari rekening ini. */
export const spentFrom = (id: string, receipts: Receipt[]) => receipts.reduce((s, r) => (r.accountId === id ? s + receiptTotal(r) : s), 0);

export const balanceOf = (a: Account, receipts: Receipt[]) => a.initial - spentFrom(a.id, receipts);

export const typeInfo = (t: AccountType) => ACCOUNT_TYPES.find((x) => x.key === t) ?? ACCOUNT_TYPES[0];

/** Warna tulisan yang terbaca di atas warna latar tertentu: gelap untuk latar terang, putih untuk latar gelap. */
export function readableOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#FFFFFF';
  const n = parseInt(m[1], 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.62 ? '#111827' : '#FFFFFF';
}
