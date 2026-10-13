/** Kalkulator sederhana untuk input nominal: ekspresi berupa teks, mis. "12000+5000-2000,5". */

const OPS = '+-';
export const hasOperator = (expr: string) => /\d[+-]/.test(expr) || /[+-]$/.test(expr.slice(1));

/** Hitung ekspresi (kiri ke kanan). Operator di ujung diabaikan; hasil dibulatkan ke rupiah. */
export function evaluate(expr: string): number {
  const clean = expr.replace(/[+-]+$/, '');
  const parts = clean.match(/[+-]?[\d,]+/g) ?? [];
  const sum = parts.reduce((t, p) => t + (Number(p.replace(',', '.')) || 0), 0);
  return Math.max(0, Math.round(sum));
}

/** Tambah satu ketukan tombol ke ekspresi. */
export function press(expr: string, key: string): string {
  if (key === '⌫') return expr.slice(0, -1);
  const last = expr.slice(-1);
  const current = expr.split(/[+-]/).pop() ?? '';
  if (OPS.includes(key)) {
    if (!expr) return expr; // tidak boleh diawali operator
    return OPS.includes(last) ? expr.slice(0, -1) + key : expr + key;
  }
  if (key === ',') {
    if (current.includes(',')) return expr;
    return expr + (current ? ',' : '0,');
  }
  if (key === '000' && !current) return expr;
  if (current === '0' && key !== '000') return expr.slice(0, -1) + key;
  if (current === '0') return expr;
  return (expr + key).length > 18 ? expr : expr + key;
}

/** Tampilkan ekspresi dengan titik ribuan, mis. "12000+500" -> "12.000+500". */
export function display(expr: string): string {
  if (!expr) return '0';
  return expr.replace(/\d+/g, (d, offset: number, whole: string) => (whole[offset - 1] === ',' ? d : d.replace(/\B(?=(\d{3})+(?!\d))/g, '.')));
}
