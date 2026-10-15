import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { uid } from './format';
import { receiptTotal } from './report';
import { Receipt } from './types';

export type AccountType = 'bank' | 'ewallet' | 'tunai' | 'kredit';

export const ACCOUNT_TYPES: { key: AccountType; label: string; icon: 'business-outline' | 'phone-portrait-outline' | 'cash-outline' | 'card-outline' }[] = [
  { key: 'bank', label: 'Bank', icon: 'business-outline' },
  { key: 'ewallet', label: 'E-wallet', icon: 'phone-portrait-outline' },
  { key: 'tunai', label: 'Tunai', icon: 'cash-outline' },
  { key: 'kredit', label: 'Kartu kredit', icon: 'card-outline' },
];

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  color: string;
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
    const saved = (JSON.parse(raw) as unknown[]).filter(valid);
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
