import { computeSplit } from './split';
import { Person, Receipt } from './types';

export interface DayShares {
  date: string;
  people: { id: string; name: string; amount: number }[]; // urut dari terbesar
  total: number;
}
export interface FamilyReport {
  perPerson: { id: string; name: string; amount: number }[]; // semua anggota, urut dari terbesar
  days: DayShares[]; // terbaru dulu
  total: number;
}

/** Akumulasi bagian tiap anggota dari split bill, per hari dan total pada rentang [from, to]. */
export function buildFamilyReport(receipts: Receipt[], members: Person[], from: string, to: string): FamilyReport {
  const ids = new Set(members.map((m) => m.id));
  const names = new Map(members.map((m) => [m.id, m.name]));
  const totals = new Map<string, number>(members.map((m) => [m.id, 0]));
  const byDay = new Map<string, Map<string, number>>();

  for (const r of receipts) {
    if (!r.people?.length || r.date < from || r.date > to) continue;
    for (const s of computeSplit(r).shares) {
      if (!ids.has(s.personId) || s.total <= 0) continue;
      totals.set(s.personId, (totals.get(s.personId) ?? 0) + s.total);
      const day = byDay.get(r.date) ?? new Map<string, number>();
      day.set(s.personId, (day.get(s.personId) ?? 0) + s.total);
      byDay.set(r.date, day);
    }
  }

  const list = (m: Map<string, number>) =>
    [...m.entries()].map(([id, amount]) => ({ id, name: names.get(id) ?? '', amount })).sort((a, b) => b.amount - a.amount);
  const days = [...byDay.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, m]) => ({ date, people: list(m), total: [...m.values()].reduce((s, v) => s + v, 0) }));
  const perPerson = list(totals);
  return { perPerson, days, total: perPerson.reduce((s, p) => s + p.amount, 0) };
}
