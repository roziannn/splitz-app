import { Receipt } from './types';

/** Angka desimal gaya Indonesia: "12,5" dan "12.5" sama-sama 12.5. */
export const parseDec = (s: string) => Number(String(s).replace(',', '.').replace(/[^\d.]/g, '')) || 0;

/** Liter tanpa nol di belakang: 12.50 -> "12,5". */
export const fmtLiters = (n: number) => (Math.round(n * 100) / 100).toString().replace('.', ',');

export const FUEL_TYPES = ['Pertalite', 'Pertamax', 'Pertamax Turbo', 'Dexlite', 'Solar'];
export const STATIONS = ['Pertamina', 'Shell', 'BP', 'Vivo'];

/** Catatan bensin sebelum tanggal ini yang punya odometer (paling baru). */
export function previousFill(all: Receipt[], date: string, selfId?: string): Receipt | undefined {
  return all
    .filter((r) => r.source === 'bensin' && r.id !== selfId && r.fuel?.odometer && r.date <= date)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)[0];
}
