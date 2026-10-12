import { Receipt } from './types';

/** Tujuan layar edit: catatan bensin punya form sendiri, lainnya memakai detail struk. */
export const editHref = (r: Pick<Receipt, 'id' | 'source'>) => (r.source === 'bensin' ? `/tambah/bensin?id=${r.id}` : `/receipt/${r.id}`);

/** Split bill hanya untuk struk hasil scan (data lama tanpa asal dianggap hasil scan). */
export const canSplit = (r: Pick<Receipt, 'source'>) => r.source === 'scan' || !r.source;
