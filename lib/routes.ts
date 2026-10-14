import { Receipt } from './types';

/** Tujuan layar edit: bensin dan catatan manual satu item punya form sendiri, lainnya memakai detail struk. */
export const editHref = (r: Pick<Receipt, 'id' | 'source' | 'items'>) =>
  r.source === 'bensin'
    ? `/tambah/bensin?id=${r.id}`
    : r.source === 'manual' && r.items.length === 1
      ? `/tambah/manual?id=${r.id}`
      : `/receipt/${r.id}`;

/** Split bill untuk struk scan dan input manual; catatan bensin tidak. */
export const canSplit = (r: Pick<Receipt, 'source'>) => r.source !== 'bensin';
