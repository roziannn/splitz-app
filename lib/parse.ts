import { CATEGORIES, Category, Item, Receipt } from './types';
import { today, uid } from './format';

export interface OcrLine {
  text: string;
  top: number;
  bottom: number;
  left: number;
}

const MONTHS: Record<string, number> = {
  jan: 1, januari: 1, january: 1, feb: 2, februari: 2, february: 2, mar: 3, maret: 3, march: 3,
  apr: 4, april: 4, mei: 5, may: 5, jun: 6, juni: 6, june: 6, jul: 7, juli: 7, july: 7,
  agu: 8, agt: 8, agustus: 8, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  okt: 10, oktober: 10, oct: 10, october: 10, nov: 11, november: 11, des: 12, desember: 12, dec: 12, december: 12,
};

const CATEGORY_WORDS: Record<Exclude<Category, 'Lainnya'>, string[]> = {
  Minuman: ['kopi', 'coffee', 'latte', 'espresso', 'cappuccino', 'teh', 'tea', 'jus', 'juice', 'susu', 'milk', 'air mineral', 'aqua', 'cola', 'sprite', 'fanta', 'es ', 'boba', 'smoothie', 'soda', 'mineral', 'lemon', 'thai tea', 'matcha'],
  Makanan: ['nasi', 'mie', 'mi ', 'ayam', 'bebek', 'sate', 'bakso', 'soto', 'roti', 'burger', 'pizza', 'pasta', 'steak', 'ikan', 'udang', 'sapi', 'goreng', 'bakar', 'rice', 'chicken', 'noodle', 'kentang', 'fries', 'snack', 'cake', 'kue', 'donat', 'dimsum', 'sushi', 'ramen', 'gado', 'pecel', 'rendang', 'telur', 'tempe', 'tahu', 'salad', 'sandwich', 'martabak', 'cireng', 'seblak'],
  Transportasi: ['bensin', 'pertalite', 'pertamax', 'solar', 'parkir', 'parking', 'tol', 'ojek', 'grab', 'gojek', 'taksi', 'taxi', 'bbm'],
  Kesehatan: ['obat', 'vitamin', 'apotek', 'paracetamol', 'masker', 'klinik', 'dokter', 'tablet', 'sirup'],
  Hiburan: ['bioskop', 'cinema', 'tiket', 'ticket', 'game', 'karaoke', 'netflix', 'xxi'],
  Tagihan: ['listrik', 'pulsa', 'internet', 'token', 'pdam', 'bpjs', 'asuransi', 'cicilan'],
  Belanja: ['sabun', 'shampo', 'sampo', 'detergen', 'tissue', 'tisu', 'pasta gigi', 'baju', 'kaos', 'sepatu', 'tas ', 'plastik', 'baterai', 'sikat', 'popok', 'minyak', 'gula', 'beras', 'tepung', 'garam', 'kantong'],
};

export function guessCategory(name: string): Category {
  const n = ' ' + name.toLowerCase() + ' ';
  for (const cat of ['Minuman', 'Transportasi', 'Kesehatan', 'Hiburan', 'Tagihan', 'Makanan', 'Belanja'] as const) {
    if (CATEGORY_WORDS[cat].some((w) => n.includes(w))) return cat;
  }
  return 'Lainnya';
}

/** "15.000", "15,000", "Rp 15.000,00", "1.250.000" -> angka rupiah. null jika bukan harga. */
export function parsePrice(raw: string): number | null {
  let s = raw.replace(/rp\.?/gi, '').replace(/\s/g, '');
  if (!/^-?[\d.,]+$/.test(s) || !/\d/.test(s)) return null;
  const neg = s.startsWith('-');
  s = s.replace(/^-/, '');
  // desimal ',00' / '.00' di belakang ribuan dibuang
  const dec = s.match(/^(.*\d)[.,](\d{2})$/);
  if (dec && /[.,]/.test(dec[1])) s = dec[1];
  const digits = s.replace(/[.,]/g, '');
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return neg ? -n : n;
}

const PRICE_AT_END = /(-?\s?(?:rp\.?\s?)?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|-?\s?(?:rp\.?\s?)?\d{3,9})\s*[a-z]?$/i;

const KW = {
  total: /\b(grand\s*total|total\s*(bayar|belanja|tagihan|pembayaran|akhir)?|jumlah\s*(bayar|total)?|total)\b/i,
  subtotal: /\b(sub\s*-?\s*total|subtotal)\b/i,
  tax: /\b(ppn|pb1|pajak|tax|vat)\b/i,
  service: /\b(service|servis|svc|s\.?charge|layanan)\b/i,
  discount: /\b(disk(on)?|discount|potongan|promo|voucher|hemat)\b/i,
  payment: /\b(tunai|cash|kembali|kembalian|change|bayar|debit|kredit|credit|qris|gopay|ovo|dana|shopeepay|e-?money|kartu|card|edc|dibayar|payment)\b/i,
  noise: /\b(kasir|cashier|struk|invoice|inv\b|no\.?\s*(meja|order|trx|transaksi|nota|bill)|meja|table|npwp|telp|tel\b|phone|wa\b|terima kasih|thank|selamat|www\.|\.com|wifi|password|alamat|jl\.|jalan|operator|printed|tanggal|date|waktu|time|pelanggan|customer|member|poin|point|item\b|qty\b|harga\b|struk)\b/i,
};

function groupRows(lines: OcrLine[]): string[] {
  const sorted = [...lines].sort((a, b) => a.top - b.top || a.left - b.left);
  const heights = sorted.map((l) => l.bottom - l.top).filter((h) => h > 0).sort((a, b) => a - b);
  const med = heights.length ? heights[Math.floor(heights.length / 2)] : 20;
  const rows: OcrLine[][] = [];
  for (const l of sorted) {
    const cy = (l.top + l.bottom) / 2;
    const row = rows.find((r) => {
      const ry = r.reduce((s, x) => s + (x.top + x.bottom) / 2, 0) / r.length;
      return Math.abs(ry - cy) < med * 0.6;
    });
    if (row) row.push(l);
    else rows.push([l]);
  }
  return rows
    .sort((a, b) => a[0].top - b[0].top)
    .map((r) => r.sort((a, b) => a.left - b.left).map((x) => x.text.trim()).join(' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function findDate(rows: string[]): string | null {
  for (const r of rows) {
    let m = r.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
    if (m) return iso(+m[1], +m[2], +m[3]);
    m = r.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4}|\d{2})\b/);
    if (m) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
    m = r.match(/\b(\d{1,2})[\s-]([a-z]{3,9})[\s-,]*(\d{4}|\d{2})\b/i);
    if (m && MONTHS[m[2].toLowerCase()]) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  }
  return null;
}

function iso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Ambil harga di ujung baris; kembalikan sisanya sebagai teks kiri. */
function splitPrice(row: string): { left: string; price: number } | null {
  const m = row.match(PRICE_AT_END);
  if (!m || m.index === undefined) return null;
  const price = parsePrice(m[1]);
  if (price === null) return null;
  return { left: row.slice(0, m.index).trim(), price };
}

export function parseReceipt(lines: OcrLine[]): Receipt {
  const rows = groupRows(lines);
  const items: Item[] = [];
  let tax = 0, service = 0, discount = 0, parsedTotal = 0;
  let pendingName: string | null = null;

  const merchant =
    rows.slice(0, 6).find((r) => /[a-z]{3,}/i.test(r) && !KW.noise.test(r) && !findDate([r]) && !/^[\d\s.,:/-]+$/.test(r)) || 'Toko';

  for (const row of rows) {
    if (row === merchant) continue;
    const sp = splitPrice(row);

    if (sp) {
      if (KW.subtotal.test(row)) continue;
      if (KW.tax.test(row)) { tax += Math.abs(sp.price); continue; }
      if (KW.service.test(row)) { service += Math.abs(sp.price); continue; }
      if (KW.discount.test(row)) { discount += Math.abs(sp.price); continue; }
      if (KW.payment.test(row)) continue;
      if (KW.total.test(row)) { parsedTotal = Math.max(parsedTotal, sp.price); continue; }
      if (KW.noise.test(row) || sp.price < 100 || sp.price < 0) continue;
      if (findDate([row])) continue;

      let left = sp.left;
      let qty = 1;
      // "2 x 15.000" atau "2x" -> harga baris = qty x harga satuan jika kolom total tidak ada
      const unit = left.match(/(?:^|\s)(\d{1,3})\s*[x×*]\s*(?:rp\.?\s?)?([\d.,]+)\s*$/i);
      if (unit) {
        qty = +unit[1];
        const up = parsePrice(unit[2]);
        left = left.slice(0, unit.index).trim();
        if (up !== null && Math.abs(up - sp.price) < 1 && qty > 1) sp.price = up * qty; // hanya satu angka: itu harga satuan
      } else {
        const lead = left.match(/^(\d{1,2})\s*[x×]?\s+(?=[a-z])/i);
        if (lead) { qty = +lead[1]; left = left.slice(lead[0].length); }
        const trail = left.match(/\s(\d{1,2})$/);
        if (trail && /[a-z]/i.test(left.slice(0, trail.index))) { qty = +trail[1]; left = left.slice(0, trail.index).trim(); }
      }
      left = left.replace(/[@:]+\s*$/, '').trim();

      if (!/[a-z]/i.test(left)) {
        // baris hanya angka: nama ada di baris sebelumnya
        if (pendingName) { items.push(mk(pendingName, qty, sp.price)); pendingName = null; }
        continue;
      }
      items.push(mk(left, qty, sp.price));
      pendingName = null;
    } else {
      const only = row.match(/^(\d{1,3})\s*[x×]\s*(?:rp\.?\s?)?([\d.,]+)$/i);
      if (only && pendingName) {
        const up = parsePrice(only[2]);
        if (up !== null) items.push(mk(pendingName, +only[1], up * +only[1]));
        pendingName = null;
      } else if (/[a-z]{3,}/i.test(row) && !KW.noise.test(row) && !KW.payment.test(row) && !KW.total.test(row) && !findDate([row])) {
        pendingName = row;
      } else {
        pendingName = null;
      }
    }
  }

  const sub = items.reduce((s, i) => s + i.price, 0);
  return {
    id: uid(),
    merchant: merchant.slice(0, 60),
    date: findDate(rows) ?? today(),
    items,
    tax,
    service,
    discount,
    total: sub + tax + service - discount,
    people: [],
    createdAt: Date.now(),
  };
}

function mk(name: string, qty: number, price: number): Item {
  const clean = name.replace(/\s+/g, ' ').trim();
  return { id: uid(), name: clean, qty: Math.max(1, qty), price, category: guessCategory(clean), assignedTo: [] };
}

export { CATEGORIES };
