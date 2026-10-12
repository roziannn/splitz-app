// Jalankan: npm run test:parse  (transpile TS lewat paket typescript, tanpa dependensi tambahan)
const ts = require('typescript'), fs = require('fs'), assert = require('assert');
require.extensions['.ts'] = (m, f) =>
  m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText, f);
const { parseReceipt } = require('../lib/parse');

const toLines = (raw) => raw.map((text, i) => ({ text, top: i * 30, bottom: i * 30 + 20, left: 0 }));
const HEADER = ['BEEPOS', 'Cafe Bee', 'Jl. Kemang Selatan I No.20', 'Surabaya, 021-33335800', 'Tanggal: 24-05-2023 16:45', 'Kasir : Hafiz', 'No Trx : JL/0022305241645/004', 'Member : CASH', 'Channel : Dine In'];
const FOOTER = ['Subtotal 172,500', 'Pajak 18,975', 'Total 191,475', 'TUNAI 200,000', 'Kembalian 8,525', '** Supported by bee.id **', 'bee.id'];
const EXPECTED = ['Bakso:2:24000', 'Cah kangkung:3:22500', 'Cap Jay:3:51000', 'Cumi Goreng Tepung Gurih:3:75000'];

const cases = {
  'struk Cafe Bee (qty x harga dan total sebaris)': [...HEADER, 'Bakso', '2 x 12,000 24,000', 'Cah kangkung', '3 x 7,500 22,500', 'Cap Jay', '3 x 17,000 51,000', 'Cumi Goreng Tepung Gurih', '3 x 25,000 75,000', ...FOOTER],
  'struk Cafe Bee (total di baris terpisah)': [...HEADER, 'Bakso', '2 x 12,000', '24,000', 'Cah kangkung', '3 x 7,500', '22,500', 'Cap Jay', '3 x 17,000', '51,000', 'Cumi Goreng Tepung Gurih', '3 x 25,000', '75,000', ...FOOTER],
};
for (const [name, raw] of Object.entries(cases)) {
  const r = parseReceipt(toLines(raw));
  assert.deepStrictEqual(r.items.map((i) => `${i.name}:${i.qty}:${i.price}`), EXPECTED, name);
  assert.strictEqual(r.tax, 18975, name);
  assert.strictEqual(r.date, '2023-05-24', name);
  console.log('ok -', name);
}
