import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadReceipts, saveReceipts } from './storage';
import { Receipt } from './types';

interface Ctx {
  receipts: Receipt[];
  ready: boolean;
  upsert: (r: Receipt) => void;
  remove: (id: string) => void;
  get: (id: string) => Receipt | undefined;
}

const StoreCtx = createContext<Ctx>(null as any);
export const useStore = () => useContext(StoreCtx);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadReceipts().then((r) => {
      setReceipts(r);
      setReady(true);
    });
  }, []);

  const commit = useCallback((fn: (prev: Receipt[]) => Receipt[]) => {
    setReceipts((prev) => {
      const next = fn(prev);
      saveReceipts(next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      receipts,
      ready,
      upsert: (r) =>
        commit((prev) => (prev.some((x) => x.id === r.id) ? prev.map((x) => (x.id === r.id ? r : x)) : [r, ...prev])),
      remove: (id) => commit((prev) => prev.filter((x) => x.id !== id)),
      get: (id) => receipts.find((r) => r.id === id),
    }),
    [receipts, ready, commit],
  );
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
