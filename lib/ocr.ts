import * as ImageManipulator from 'expo-image-manipulator';
import { getApiKey } from './storage';
import { CATEGORIES, Category, Item, Receipt } from './types';
import { today, uid } from './format';

const MODEL = 'claude-sonnet-5-5';

const PROMPT = `Kamu adalah mesin OCR struk belanja Indonesia. Baca gambar struk dan balas HANYA dengan JSON valid (tanpa markdown) dengan bentuk:
{"merchant":string,"date":"YYYY-MM-DD","items":[{"name":string,"qty":number,"price":number,"category":string}],"tax":number,"service":number,"discount":number,"total":number}
Aturan:
- "price" adalah TOTAL harga baris (qty x harga satuan) dalam Rupiah, angka bulat tanpa pemisah ribuan.
- "category" salah satu dari: ${CATEGORIES.join(', ')}.
- tax = PPN/pajak, service = service charge, discount = total potongan (positif). Isi 0 jika tidak ada.
- Jika tanggal tidak terbaca, pakai ${'$'}{TODAY}.`;

async function toBase64(uri: string): Promise<string> {
  const out = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1400 } }], {
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!out.base64) throw new Error('Gagal memproses gambar');
  return out.base64;
}

const cat = (c: unknown): Category => (CATEGORIES.includes(c as Category) ? (c as Category) : 'Lainnya');
const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : Number(String(v ?? 0).replace(/[^\d.-]/g, '')) || 0);

export async function scanReceipt(uri: string): Promise<Receipt> {
  const key = await getApiKey();
  if (!key) throw new Error('API key belum diisi. Buka tab Pengaturan.');
  const data = await toBase64(uri);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } },
            { type: 'text', text: PROMPT.replace('${TODAY}', today()) },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(res.status === 401 ? 'API key tidak valid.' : `Gagal memindai (${res.status}): ${t.slice(0, 120)}`);
  }
  const json = await res.json();
  const text: string = json.content?.find((c: any) => c.type === 'text')?.text ?? '';
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Struk tidak terbaca. Coba foto yang lebih jelas.');
  const p = JSON.parse(m[0]);

  const items: Item[] = (Array.isArray(p.items) ? p.items : []).map((i: any) => ({
    id: uid(),
    name: String(i.name ?? 'Item'),
    qty: Math.max(1, num(i.qty) || 1),
    price: num(i.price),
    category: cat(i.category),
    assignedTo: [],
  }));
  const sub = items.reduce((s, i) => s + i.price, 0);
  const tax = num(p.tax), service = num(p.service), discount = Math.abs(num(p.discount));
  return {
    id: uid(),
    merchant: String(p.merchant || 'Toko'),
    date: /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : today(),
    items,
    tax,
    service,
    discount,
    total: num(p.total) || sub + tax + service - discount,
    people: [],
    createdAt: Date.now(),
  };
}
