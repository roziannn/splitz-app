import { localIso } from './dates';
import { Receipt } from './types';

export type Range = 'day' | 'week' | 'month' | 'mtd' | 'all';

const MAX_POINTS = 90; // batas titik pada grafik garis

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
  outside: { count: number; latest: string | null }; // struk yang tidak masuk periode ini
  clipped: boolean; // grafik hanya memuat MAX_POINTS hari terakhir
}

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  return localIso(new Date(y, m - 1, d + n));
};

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const subtotal = (r: Receipt) => (r.items ?? []).reduce((s, i) => s + num(i.price), 0);
const extraOf = (r: Receipt) => num(r.tax) + num(r.service) - num(r.discount);

/** Total struk = subtotal item + pajak + service - diskon (selalu dihitung ulang; nilai kosong dianggap 0). */
export const receiptTotal = (r: Receipt) => subtotal(r) + extraOf(r);

const daysBetween = (a: string, b: string) => {
  const t = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((t(b) - t(a)) / 86400000);
};

export function buildReport(receipts: Receipt[], range: Range, todayIso: string = localIso()): Report {
  const dated = receipts.filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date ?? ''));
  const earliest = dated.reduce<string | null>((m, r) => (m === null || r.date < m ? r.date : m), null);
  const latest = dated.reduce<string | null>((m, r) => (m === null || r.date > m ? r.date : m), null);

  // Struk bertanggal setelah hari ini (mis. tanggal salah baca) tetap dihitung pada "Semua".
  const to = range === 'all' && latest && latest > todayIso ? latest : todayIso;
  let from: string;
  if (range === 'day') from = todayIso;
  else if (range === 'week') from = addDays(todayIso, -6);
  else if (range === 'month') from = addDays(todayIso, -29);
  else if (range === 'mtd') from = todayIso.slice(0, 8) + '01';
  else from = earliest && earliest < todayIso ? earliest : todayIso;
  const days = daysBetween(from, to) + 1;

  const hasPrev = range !== 'all';
  const prevFrom = addDays(from, -days);
  const prevTo = addDays(from, -1);

  const inRange = dated.filter((r) => r.date >= from && r.date <= to);
  const prev = hasPrev ? dated.filter((r) => r.date >= prevFrom && r.date <= prevTo) : [];
  const outsideList = dated.filter((r) => !(r.date >= from && r.date <= to));

  const perDay: Record<string, number> = {};
  for (const r of dated) perDay[r.date] = (perDay[r.date] || 0) + receiptTotal(r);

  const cat: Record<string, number> = {};
  let total = 0;
  for (const r of inRange) {
    const sub = subtotal(r);
    const extra = extraOf(r); // dibagi ke kategori sesuai porsi harga
    if (sub > 0) for (const i of r.items) cat[i.category] = (cat[i.category] || 0) + num(i.price) + extra * (num(i.price) / sub);
    else if (extra > 0) cat.Lainnya = (cat.Lainnya || 0) + extra;
    total += sub + extra;
  }

  const byCat = Object.entries(cat)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, pct: total > 0 ? (value / total) * 100 : 0 }));

  // Garis tren: untuk "Hari ini" tampilkan 7 hari terakhir agar ada alur yang terlihat.
  const span = range === 'day' ? 7 : Math.min(days, MAX_POINTS);
  const series: DayPoint[] = Array.from({ length: span }, (_, i) => {
    const date = addDays(to, -(span - 1 - i));
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
    outside: { count: outsideList.length + (receipts.length - dated.length), latest: outsideList.reduce<string | null>((m, r) => (m === null || r.date > m ? r.date : m), null) },
    clipped: range !== 'day' && days > MAX_POINTS,
  };
}

/** 1.250.000 -> "1,3jt", 350.000 -> "350rb" */
export const compact = (n: number) => {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'jt';
  if (n >= 1e3) return Math.round(n / 1e3) + 'rb';
  return String(Math.round(n));
};
