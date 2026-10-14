import { buildFamilyReport } from './familyReport';
import { rupiah } from './format';
import { categoryTotals, receiptTotal } from './report';
import { Person, Receipt } from './types';

// Pembuat PDF sederhana tanpa pustaka tambahan: teks Helvetica pada halaman A4.
const W = 595.28;
const H = 841.89;
const M = 40;
const LINE = 14;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const fmtDate = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : iso;
};

// Lebar kira-kira huruf Helvetica (per 1 pt), cukup untuk meratakan angka ke kanan.
const widthOf = (s: string, size: number) => {
  let w = 0;
  for (const c of s) w += /\d/.test(c) ? 0.556 : '.,: '.includes(c) ? 0.278 : c === '-' ? 0.333 : c === 'R' ? 0.722 : 0.52;
  return w * size;
};

// Hanya karakter Latin-1 yang aman untuk fon bawaan PDF.
const clean = (s: string) =>
  s
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/·/g, '-')
    .replace(/[^\x20-\x7e -ÿ]/g, '?')
    .replace(/[\\()]/g, (c) => '\\' + c);

const fit = (s: string, maxW: number, size: number) => {
  const max = Math.max(4, Math.floor(maxW / (size * 0.52)));
  return s.length > max ? s.slice(0, max - 1) + '.' : s;
};

class Page {
  ops: string[] = [];
}

class Doc {
  pages: Page[] = [new Page()];
  y = H - M;
  get page() {
    return this.pages[this.pages.length - 1];
  }
  ensure(h: number) {
    if (this.y - h < M + 20) {
      this.pages.push(new Page());
      this.y = H - M;
    }
  }
  text(x: number, s: string, size = 10, bold = false, right = false) {
    const px = right ? x - widthOf(s, size) : x;
    this.page.ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${px.toFixed(2)} ${this.y.toFixed(2)} Td (${clean(s)}) Tj ET`);
  }
  rule() {
    this.page.ops.push(`0.8 G 0.5 w ${M} ${(this.y + 13).toFixed(2)} m ${W - M} ${(this.y + 13).toFixed(2)} l S`);
  }
  down(n = LINE) {
    this.y -= n;
  }
}

/** Laporan pengeluaran pada rentang tanggal sebagai PDF (base64). */
export function buildPdfBase64(receipts: Receipt[], from: string, to: string, members: Person[] = []): string {
  const list = receipts.filter((r) => r.date >= from && r.date <= to).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  const { total, byCat } = categoryTotals(list);
  const fam = members.length ? buildFamilyReport(receipts, members, from, to) : null;
  const R = W - M;
  const d = new Doc();

  d.text(M, 'Laporan Pengeluaran', 18, true);
  d.down(18);
  d.text(M, `Periode: ${fmtDate(from)} - ${fmtDate(to)}`, 10);
  d.down(22);

  d.text(M, 'Total pengeluaran', 11, true);
  d.text(R, rupiah(total), 13, true, true);
  d.down(LINE);
  d.text(M, 'Jumlah catatan', 10);
  d.text(R, String(list.length), 10, false, true);
  d.down(24);

  if (byCat.length) {
    d.text(M, 'Per kategori', 12, true);
    d.down(LINE + 2);
    for (const c of byCat) {
      d.ensure(LINE);
      d.text(M, c.name, 10);
      d.text(R - 70, `${c.pct.toFixed(0)}%`, 10, false, true);
      d.text(R, rupiah(c.value), 10, false, true);
      d.down();
    }
    d.down(10);
  }

  if (fam && fam.total > 0) {
    d.ensure(40);
    d.text(M, 'Per anggota', 12, true);
    d.down(LINE + 2);
    for (const p of fam.perPerson.filter((x) => x.amount > 0)) {
      d.ensure(LINE);
      d.text(M, p.name, 10);
      d.text(R, rupiah(p.amount), 10, false, true);
      d.down();
    }
    d.down(10);
  }

  d.ensure(50);
  d.text(M, 'Rincian', 12, true);
  d.down(LINE + 4);
  for (const r of list) {
    const extra = [r.tax ? ['Pajak', r.tax] : null, r.service ? ['Service', r.service] : null, r.discount ? ['Diskon', -r.discount] : null].filter(Boolean) as [string, number][];
    d.ensure(LINE * (2 + r.items.length + extra.length));
    d.rule();
    d.text(M, fmtDate(r.date), 10, true);
    d.text(M + 90, fit(r.merchant, R - 130 - (M + 90), 10), 10, true);
    d.text(R, rupiah(receiptTotal(r)), 10, true, true);
    d.down();
    for (const i of r.items) {
      d.ensure(LINE);
      d.text(M + 90, fit(`${i.name || 'Item'}${i.qty > 1 ? ` x${i.qty}` : ''}`, R - 130 - (M + 90), 9), 9);
      d.text(R, rupiah(i.price), 9, false, true);
      d.down(12);
    }
    for (const [k, v] of extra) {
      d.ensure(LINE);
      d.text(M + 90, k, 9);
      d.text(R, (v < 0 ? '-' : '') + rupiah(Math.abs(v)), 9, false, true);
      d.down(12);
    }
    d.down(6);
  }
  if (!list.length) d.text(M, 'Tidak ada catatan pada periode ini.', 10);

  // Nomor halaman
  d.pages.forEach((p, i) => {
    p.ops.push(`BT /F1 8 Tf ${(W / 2 - 25).toFixed(2)} ${M - 10} Td (Halaman ${i + 1} dari ${d.pages.length}) Tj ET`);
  });

  // Susun berkas PDF
  const objs: string[] = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  const kids = d.pages.map((_, i) => `${5 + 2 * i} 0 R`).join(' ');
  objs[2] = `<< /Type /Pages /Kids [${kids}] /Count ${d.pages.length} >>`;
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  d.pages.forEach((p, i) => {
    const content = p.ops.join('\n');
    objs[5 + 2 * i] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + 2 * i} 0 R >>`;
    objs[6 + 2 * i] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });

  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let n = 1; n < objs.length; n++) {
    offsets[n] = out.length;
    out += `${n} 0 obj\n${objs[n]}\nendobj\n`;
  }
  const xref = out.length;
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for (let n = 1; n < objs.length; n++) out += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return btoa(out);
}
