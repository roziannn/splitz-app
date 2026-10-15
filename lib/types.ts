export const CATEGORIES = ['Makanan', 'Minuman', 'Belanja', 'Transportasi', 'Kesehatan', 'Hiburan', 'Tagihan', 'Lainnya'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Item {
  id: string;
  name: string;
  qty: number;
  price: number; // total harga baris (qty x harga satuan)
  category: string; // salah satu Category (hasil scan) atau kategori input manual
  assignedTo: string[]; // id peserta; kosong = belum dibagi
}

export interface Person {
  id: string;
  name: string;
}

/** Asal catatan: menentukan fitur yang tersedia (split bill hanya untuk hasil scan). */
export type Source = 'scan' | 'manual' | 'bensin';

/** Data khusus catatan bensin. */
export interface Fuel {
  type: string; // mis. Pertalite
  liters: number;
  pricePerLiter: number;
  odometer?: number; // km
}

export interface Receipt {
  id: string;
  merchant: string;
  date: string; // YYYY-MM-DD
  items: Item[];
  tax: number;
  service: number;
  discount: number;
  total: number;
  people: Person[];
  createdAt: number;
  image?: string; // nama file foto struk di documentDirectory/receipts
  source?: Source; // kosong = data lama (dianggap hasil scan)
  fuel?: Fuel;
  accountId?: string; // rekening/kartu asal pembayaran (opsional)
}
