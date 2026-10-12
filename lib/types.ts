export const CATEGORIES = ['Makanan', 'Minuman', 'Belanja', 'Transportasi', 'Kesehatan', 'Hiburan', 'Tagihan', 'Lainnya'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Item {
  id: string;
  name: string;
  qty: number;
  price: number; // total harga baris (qty x harga satuan)
  category: Category;
  assignedTo: string[]; // id peserta; kosong = belum dibagi
}

export interface Person {
  id: string;
  name: string;
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
}
