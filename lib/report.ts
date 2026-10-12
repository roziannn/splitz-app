import { localIso } from './dates';
import { Receipt } from './types';

export type Range = 'day' | 'week' | 'month';

export const RANGE_DAYS: Record<Range, number> = { day: 1, week: 7, month: 30 };

export interface CatSlice { name: string; value: number; pct: number }
export interface DayPoint { date: string; value: number }

export interface Report {
  total: number;
  count: number;
  avgPerDay: number;
  prevTotal: number;
  delta: number | null; // persen vs periode sebelumnya; null jika periode sebelumnya kosong
  byCat: CatSlice[];
  series: DayPoint[]; // total per hari, hari tanpa belanja = 0
}

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  return localIso(new Date(y, m - 1, d + n));
};

/** Total struk = subtotal item + pajak + service - diskon (selalu dihitung ulang, bukan nilai tersimpan). */
export const receiptTotal = (r: Receipt) => r.items.reduce((s, i) => s + i.price, 0) + r.tax + r.service - r.discount;

export function buildReport(receipts: Receipt[], range: Range, todayIso: string = localIso()): Report {
  const days = RANGE_DAYS[range];
  const from = addDays(todayIso, -(days - 1));
  const prevFrom = addDays(from, -days);
  const prevTo = addDays(from, -1);

  const inRange = receipts.filter((r) => r.date >= from && r.date <= todayIso);
  const prev = receipts.filter((r) => r.date >= prevFrom && r.date <= prevTo);

  const perDay: Record<string, number> = {};
  for (const r of receipts) perDay[r.date] = (perDay[r.date] || 0) + receiptTotal(r);

  const cat: Record<string, number> = {};
  let total = 0;
  for (const r of inRange) {
    const sub = r.items.reduce((s, i) => s + i.price, 0);
    const extra = r.tax + r.service - r.discount; // dibagi ke kategori sesuai porsi harga
    if (sub > 0) for (const i of r.items) cat[i.category] = (cat[i.category] || 0) + i.price + extra * (i.price / sub);
    else if (extra > 0) cat.Lainnya = (cat.Lainnya || 0) + extra;
    total += sub + extra;
  }

  const byCat = Object.entries(cat)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, pct: total > 0 ? (value / total) * 100 : 0 }));

  // Garis tren: untuk "Hari ini" tampilkan 7 hari terakhir agar ada alur yang terlihat.
  const span = range === 'day' ? 7 : days;
  const series: DayPoint[] = Array.from({ length: span }, (_, i) => {
    const date = addDays(todayIso, -(span - 1 - i));
    return { date, value: perDay[date] || 0 };
  });

  const prevTotal = prev.reduce((s, r) => s + receiptTotal(r), 0);
  return {
    total,
    count: inRange.length,
    avgPerDay: total / days,
    prevTotal,
    delta: prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null,
    byCat,
    series,
  };
}

/** 1.250.000 -> "1,3jt", 350.000 -> "350rb" */
export const compact = (n: number) => {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'jt';
  if (n >= 1e3) return Math.round(n / 1e3) + 'rb';
  return String(Math.round(n));
};
