import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
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

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tulis ke penyimpanan sekarang juga (antrean berurutan agar tidak saling menimpa).
  const writeNow = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    queue.current = queue.current.then(() => saveReceipts(latest.current)).catch(() => {});
    return queue.current;
  }, []);

  // Mengetik di banyak kolom memicu banyak perubahan beruntun; gabungkan jadi satu tulisan agar aplikasi tetap mulus.
  const schedule = useCallback(() => {
    if (!readyRef.current) return; // jangan menulis sebelum data lama selesai dimuat, supaya riwayat tidak tertimpa
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(writeNow, 250);
  }, [writeNow]);

  const commit = useCallback(
    (fn: (prev: Receipt[]) => Receipt[]) => {
      const next = fn(latest.current);
      latest.current = next;
      setReceipts(next);
      schedule();
    },
    [schedule],
  );

  const flush = useCallback(async () => {
    while (!readyRef.current) await new Promise((res) => setTimeout(res, 50));
    await writeNow();
  }, [writeNow]);

  // Pastikan perubahan yang tertunda tertulis saat aplikasi ke latar belakang atau ditutup.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active' && timer.current) writeNow();
    });
    return () => {
      sub.remove();
      if (timer.current) writeNow();
    };
  }, [writeNow]);

  // Fungsi stabil (tidak berubah antar render) agar komponen daftar yang di-memo tidak digambar ulang tanpa perlu.
  const upsert = useCallback(
    (r: Receipt) => commit((prev) => (prev.some((x) => x.id === r.id) ? prev.map((x) => (x.id === r.id ? r : x)) : [r, ...prev])),
    [commit],
  );
  const remove = useCallback(
    (id: string) => {
      deleteReceiptImage(latest.current.find((x) => x.id === id)?.image);
      commit((prev) => prev.filter((x) => x.id !== id));
    },
    [commit],
  );
  const get = useCallback((id: string) => latest.current.find((r) => r.id === id), []);

  const value = useMemo<Ctx>(() => ({ receipts, ready, upsert, remove, get, flush }), [receipts, ready, upsert, remove, get, flush]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
