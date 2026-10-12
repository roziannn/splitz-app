import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { deleteReceiptImage } from './images';
import { loadReceipts, saveReceipts } from './storage';
import { Receipt } from './types';

interface Ctx {
  receipts: Receipt[];
  ready: boolean;
  upsert: (r: Receipt) => void;
  remove: (id: string) => void;
  get: (id: string) => Receipt | undefined;
  /** Tunggu sampai semua perubahan benar-benar tertulis ke penyimpanan. */
  flush: () => Promise<void>;
}

const StoreCtx = createContext<Ctx>(null as any);
export const useStore = () => useContext(StoreCtx);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [ready, setReady] = useState(false);

  const latest = useRef<Receipt[]>([]);
  const readyRef = useRef(false);
  // Penulisan diantre berurutan agar tidak saling menimpa.
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    loadReceipts().then((r) => {
      // Gabungkan dengan perubahan yang terjadi sebelum data selesai dimuat.
      const hadPending = latest.current.length > 0;
      const merged = [...latest.current, ...r.filter((x) => !latest.current.some((y) => y.id === x.id))];
      latest.current = merged;
      readyRef.current = true;
      setReceipts(merged);
      setReady(true);
      if (hadPending) queue.current = queue.current.then(() => saveReceipts(latest.current)).catch(() => {});
    });
  }, []);

  const commit = useCallback((fn: (prev: Receipt[]) => Receipt[]) => {
    const next = fn(latest.current);
    latest.current = next;
    setReceipts(next);
    // Jangan menulis sebelum data lama selesai dimuat, supaya riwayat tidak tertimpa.
    if (!readyRef.current) return;
    queue.current = queue.current.then(() => saveReceipts(latest.current)).catch(() => {});
  }, []);

  const flush = useCallback(async () => {
    while (!readyRef.current) await new Promise((res) => setTimeout(res, 50));
    queue.current = queue.current.then(() => saveReceipts(latest.current)).catch(() => {});
    await queue.current;
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      receipts,
      ready,
      upsert: (r) =>
        commit((prev) => (prev.some((x) => x.id === r.id) ? prev.map((x) => (x.id === r.id ? r : x)) : [r, ...prev])),
      remove: (id) => {
        deleteReceiptImage(latest.current.find((x) => x.id === id)?.image);
        commit((prev) => prev.filter((x) => x.id !== id));
      },
      get: (id) => receipts.find((r) => r.id === id),
      flush,
    }),
    [receipts, ready, commit, flush],
  );
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
