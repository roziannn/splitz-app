import { Receipt } from './types';

export interface PersonShare {
  personId: string;
  name: string;
  subtotal: number;
  tax: number;
  service: number;
  discount: number;
  total: number;
  items: { name: string; amount: number }[];
}

export const itemsSubtotal = (r: Receipt) => r.items.reduce((s, i) => s + i.price, 0);

/** Pajak, service, dan diskon dibagi proporsional terhadap subtotal tiap orang. */
export function computeSplit(r: Receipt): { shares: PersonShare[]; unassigned: number } {
  const shares = new Map<string, PersonShare>(
    r.people.map((p) => [p.id, { personId: p.id, name: p.name, subtotal: 0, tax: 0, service: 0, discount: 0, total: 0, items: [] }]),
  );
  let unassigned = 0;
  for (const item of r.items) {
    const ids = item.assignedTo.filter((id) => shares.has(id));
    if (!ids.length) {
      unassigned += item.price;
      continue;
    }
    const each = item.price / ids.length;
    for (const id of ids) {
      const s = shares.get(id)!;
      s.subtotal += each;
      s.items.push({ name: ids.length > 1 ? `${item.name} (1/${ids.length})` : item.name, amount: each });
    }
  }
  const base = [...shares.values()].reduce((s, p) => s + p.subtotal, 0);
  for (const s of shares.values()) {
    const ratio = base > 0 ? s.subtotal / base : 0;
    s.tax = r.tax * ratio;
    s.service = r.service * ratio;
    s.discount = r.discount * ratio;
    s.total = s.subtotal + s.tax + s.service - s.discount;
  }
  return { shares: [...shares.values()], unassigned };
}

export const grandTotal = (r: Receipt) => itemsSubtotal(r) + r.tax + r.service - r.discount;
