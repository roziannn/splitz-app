import * as XLSX from 'xlsx';
import { uid } from './format';
import { Fuel, Item, Person, Receipt, Source } from './types';

const SOURCE: Record<string, Source> = { Scan: 'scan', Manual: 'manual', Bensin: 'bensin' };
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(String(v ?? '').replace(/[^\d.-]/g, '')) || 0);
const text = (v: unknown) => (v === undefined || v === null ? '' : String(v).trim());

/** Sel tanggal Excel (angka seri, Date, atau teks) menjadi YYYY-MM-DD; kosong jika tidak terbaca. */
function toIso(v: unknown): string {
  if (typeof v === 'number' && Number.isFinite(v)) return new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10);
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  const s = text(v);
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
}

type Row = Record<string, unknown>;
const rows = (wb: XLSX.WorkBook, name: string): Row[] => {
  const ws = wb.Sheets[name];
  return ws ? XLSX.utils.sheet_to_json<Row>(ws, { raw: true, defval: '' }) : [];
};

export interface ParsedBackup {
  receipts: Receipt[];
  warnings: string[];
}

/**
 * Baca file Excel hasil ekspor Splitz. Sheet "Item" dan "Bensin" tidak membawa id struk, tetapi urutannya sama dengan sheet "Struk",
 * jadi baris item dibagi berurutan menurut kolom "Jumlah item".
 * `members` dipakai agar nama yang sama dengan anggota keluarga memakai id anggota itu.
 */
export function parseBackup(base64: string, members: Person[] = []): ParsedBackup {
  const wb = XLSX.read(base64, { type: 'base64' });
  if (!wb.Sheets['Struk']) throw new Error('Ini bukan file ekspor Splitz (sheet "Struk" tidak ditemukan).');
  const struk = rows(wb, 'Struk');
  const items = rows(wb, 'Item');
  const bensin = rows(wb, 'Bensin');

  const warnings: string[] = [];
  const people = new Map<string, Person>(members.map((m) => [m.name.toLowerCase(), m]));
  const person = (name: string): Person => {
    const key = name.toLowerCase();
    let p = people.get(key);
    if (!p) people.set(key, (p = { id: uid(), name }));
    return p;
  };

  let ip = 0; // penunjuk baris item
  let ib = 0; // penunjuk baris bensin
  const receipts: Receipt[] = [];
  struk.forEach((row, idx) => {
    const date = toIso(row['Tanggal']);
    const count = Math.max(0, Math.round(num(row['Jumlah item'])));
    const slice = items.slice(ip, ip + count);
    ip += count;
    const source = SOURCE[text(row['Jenis'])] ?? 'scan';
    const fuelRow = source === 'bensin' ? bensin[ib++] : undefined;
    if (!date) {
      warnings.push(`Baris ${idx + 2}: tanggal tidak terbaca, dilewati.`);
      return;
    }

    const names = text(row['Peserta split']).split(',').map((s) => s.trim()).filter(Boolean);
    const participants = names.map(person);
    const parsedItems: Item[] = slice.map((it) => ({
      id: uid(),
      name: text(it['Item']),
      qty: Math.max(1, Math.round(num(it['Jumlah'])) || 1),
      price: num(it['Harga total']),
      category: text(it['Kategori']) || 'Lainnya',
      assignedTo: text(it['Dibagi ke']).split(',').map((s) => s.trim()).filter(Boolean).map((n) => person(n).id),
    }));
    const tax = num(row['Pajak']);
    const service = num(row['Service']);
    const discount = num(row['Diskon']);
    const fuel: Fuel | undefined = fuelRow
      ? {
          type: text(fuelRow['Jenis BBM']),
          liters: num(fuelRow['Liter']),
          pricePerLiter: num(fuelRow['Harga per liter']),
          ...(num(fuelRow['Odometer (km)']) > 0 ? { odometer: num(fuelRow['Odometer (km)']) } : {}),
        }
      : undefined;

    receipts.push({
      id: uid(),
      merchant: text(row['Toko / SPBU']) || 'Tanpa nama',
      date,
      items: parsedItems,
      tax,
      service,
      discount,
      total: parsedItems.reduce((s, i) => s + i.price, 0) + tax + service - discount,
      people: participants,
      createdAt: Date.now() + idx, // menjaga urutan tampil sesuai file
      source,
      ...(fuel ? { fuel } : {}),
    });
  });
  return { receipts, warnings };
}

const key = (r: Receipt) => `${r.date}|${r.merchant.toLowerCase()}|${Math.round(r.total)}|${r.items.length}`;

/** Pisahkan catatan yang sudah ada (tanggal, toko, total, jumlah item sama) agar impor ulang tidak menggandakan. */
export function dedupe(incoming: Receipt[], existing: Receipt[]): { fresh: Receipt[]; skipped: number } {
  const seen = new Set(existing.map(key));
  const fresh: Receipt[] = [];
  for (const r of incoming) {
    const k = key(r);
    if (seen.has(k)) continue;
    seen.add(k);
    fresh.push(r);
  }
  return { fresh, skipped: incoming.length - fresh.length };
}
