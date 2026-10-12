import * as XLSX from 'xlsx';
import { CATEGORIES, Receipt } from './types';
import { computeSplit } from './split';

const SOURCE_LABEL: Record<string, string> = { scan: 'Scan', manual: 'Manual', bensin: 'Bensin' };
const NUM = '#,##0';

const toDate = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : iso ?? '';
};
const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const subtotal = (r: Receipt) => (r.items ?? []).reduce((s, i) => s + n(i.price), 0);
const total = (r: Receipt) => subtotal(r) + n(r.tax) + n(r.service) - n(r.discount);

/** Buat sheet dari baris objek; kolom tanggal diberi format dd/mm/yyyy dan kolom angka format ribuan. */
function sheet(rows: Record<string, unknown>[], header: string[], widths: number[], numCols: string[] = [], dateCols: string[] = []) {
  const ws = XLSX.utils.json_to_sheet(rows, { header, cellDates: true });
  ws['!cols'] = widths.map((wch) => ({ wch }));
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  for (let R = 1; R <= range.e.r; R++) {
    header.forEach((h, C) => {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (!cell) return;
      if (numCols.includes(h) && cell.t === 'n') cell.z = NUM;
      if (dateCols.includes(h) && cell.t === 'd') cell.z = 'dd/mm/yyyy';
    });
  }
  return ws;
}

/** Susun seluruh data menjadi workbook Excel. Foto struk tidak ikut (hanya data). */
export function buildWorkbook(receipts: Receipt[]): XLSX.WorkBook {
  const list = [...receipts].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  const names = (r: Receipt, ids: string[]) => ids.map((id) => r.people.find((p) => p.id === id)?.name).filter(Boolean).join(', ');

  const H1 = ['Tanggal', 'Toko / SPBU', 'Jenis', 'Jumlah item', 'Subtotal', 'Pajak', 'Service', 'Diskon', 'Total', 'Peserta split'];
  const struk = list.map((r) => ({
    'Tanggal': toDate(r.date), 'Toko / SPBU': r.merchant, 'Jenis': SOURCE_LABEL[r.source ?? 'scan'] ?? 'Scan', 'Jumlah item': (r.items ?? []).length,
    'Subtotal': subtotal(r), 'Pajak': n(r.tax), 'Service': n(r.service), 'Diskon': n(r.discount), 'Total': total(r),
    'Peserta split': r.people.map((p) => p.name).join(', '),
  }));

  const H2 = ['Tanggal', 'Toko / SPBU', 'Item', 'Jumlah', 'Harga total', 'Kategori', 'Dibagi ke'];
  const item = list.flatMap((r) =>
    (r.items ?? []).map((i) => ({ 'Tanggal': toDate(r.date), 'Toko / SPBU': r.merchant, 'Item': i.name, 'Jumlah': i.qty, 'Harga total': n(i.price), 'Kategori': i.category, 'Dibagi ke': names(r, i.assignedTo ?? []) })),
  );

  const H3 = ['Tanggal', 'SPBU', 'Jenis BBM', 'Harga per liter', 'Liter', 'Total bayar', 'Odometer (km)'];
  const bensin = list
    .filter((r) => r.source === 'bensin')
    .map((r) => ({ 'Tanggal': toDate(r.date), 'SPBU': r.merchant, 'Jenis BBM': r.fuel?.type ?? '', 'Harga per liter': n(r.fuel?.pricePerLiter), 'Liter': n(r.fuel?.liters), 'Total bayar': total(r), 'Odometer (km)': r.fuel?.odometer ?? '' }));

  const H4 = ['Tanggal', 'Toko', 'Nama', 'Subtotal', 'Pajak', 'Service', 'Diskon', 'Total'];
  const split = list
    .filter((r) => r.people.length > 0)
    .flatMap((r) => computeSplit(r).shares.map((s) => ({ 'Tanggal': toDate(r.date), 'Toko': r.merchant, 'Nama': s.name, 'Subtotal': Math.round(s.subtotal), 'Pajak': Math.round(s.tax), 'Service': Math.round(s.service), 'Diskon': Math.round(s.discount), 'Total': Math.round(s.total) })));

  const perCat: Record<string, number> = {};
  for (const r of list) {
    const sub = subtotal(r);
    const extra = n(r.tax) + n(r.service) - n(r.discount);
    for (const i of r.items ?? []) perCat[i.category] = (perCat[i.category] ?? 0) + n(i.price) + (sub > 0 ? extra * (n(i.price) / sub) : 0);
  }
  const grand = list.reduce((s, r) => s + total(r), 0);
  const H5 = ['Kategori', 'Total', 'Persen'];
  const kategori = [...CATEGORIES]
    .filter((c) => perCat[c])
    .map((c) => ({ 'Kategori': c, 'Total': Math.round(perCat[c]), 'Persen': grand > 0 ? perCat[c] / grand : 0 }))
    .sort((a, b) => b['Total'] - a['Total']);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(struk, H1, [12, 26, 9, 12, 14, 12, 12, 12, 14, 28], ['Subtotal', 'Pajak', 'Service', 'Diskon', 'Total'], ['Tanggal']), 'Struk');
  XLSX.utils.book_append_sheet(wb, sheet(item, H2, [12, 26, 32, 8, 14, 14, 24], ['Harga total'], ['Tanggal']), 'Item');
  XLSX.utils.book_append_sheet(wb, sheet(bensin, H3, [12, 22, 16, 16, 9, 14, 14], ['Harga per liter', 'Total bayar', 'Odometer (km)'], ['Tanggal']), 'Bensin');
  XLSX.utils.book_append_sheet(wb, sheet(split, H4, [12, 26, 20, 14, 12, 12, 12, 14], ['Subtotal', 'Pajak', 'Service', 'Diskon', 'Total'], ['Tanggal']), 'Split');
  const wsK = sheet(kategori, H5, [18, 16, 10], ['Total']);
  for (let R = 1; R <= kategori.length; R++) { const c = wsK[XLSX.utils.encode_cell({ r: R, c: 2 })]; if (c) c.z = '0.0%'; }
  XLSX.utils.book_append_sheet(wb, wsK, 'Per kategori');
  return wb;
}

/** File .xlsx sebagai string base64. */
export const workbookBase64 = (receipts: Receipt[]) => XLSX.write(buildWorkbook(receipts), { type: 'base64', bookType: 'xlsx', cellDates: true }) as string;

export const backupFileName = (todayIso: string) => `Splitz-backup-${todayIso}`;
