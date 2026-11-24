import AsyncStorage from '@react-native-async-storage/async-storage';
import { Receipt } from './types';

export interface SyncChange { id: string; updatedAt: number; deleted: boolean; receipt?: Receipt }
export interface RemoteRecord { id: string; updatedAt: number; deleted: boolean; receipt: Receipt | null }
const QUEUE_KEY = 'splitz.sync.queue.v1';
const OWNER_KEY = 'splitz.sync.owner.v1';
const API = () => process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
let queueSerial: Promise<unknown> = Promise.resolve();
function withQueueLock<T>(run: () => Promise<T>): Promise<T> {
  const result = queueSerial.then(run, run);
  queueSerial = result.then(() => undefined, () => undefined);
  return result;
}

async function queueRead(): Promise<SyncChange[]> {
  try { return JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) || '[]'); } catch { return []; }
}
export async function enqueue(change: SyncChange) {
  return withQueueLock(async () => {
    const items = await queueRead();
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...items.filter((x) => x.id !== change.id), change]));
  });
}
export async function queueCount() { return withQueueLock(async () => (await queueRead()).length); }

export async function syncAccount(token: string, userId: string, local: Receipt[]) {
  const base = API();
  if (!base) throw new Error('Alamat API belum diatur');
  let owner = await AsyncStorage.getItem(OWNER_KEY);
  let pending = await withQueueLock(queueRead);
  // Migrasi satu kali: data lokal lama menjadi milik akun pertama yang dipakai.
  if (!owner) {
    pending = await withQueueLock(async () => {
      const current = await queueRead();
      const queuedIds = new Set(current.map((change) => change.id));
      const now = Date.now();
      const seeded = [...current, ...local.filter((receipt) => !queuedIds.has(receipt.id)).map((receipt, i) => ({ id: receipt.id, receipt, deleted: false, updatedAt: now + i }))];
      if (seeded.length) await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(seeded));
      return seeded;
    });
  } else if (owner !== userId) {
    // Jangan pernah mengirim data akun sebelumnya ke akun yang baru masuk.
    pending = [];
    await withQueueLock(() => AsyncStorage.setItem(QUEUE_KEY, '[]'));
  }
  let records: RemoteRecord[] = [];
  const batchSize = 100;
  const batches = pending.length ? Array.from({ length: Math.ceil(pending.length / batchSize) }, (_, i) => pending.slice(i * batchSize, (i + 1) * batchSize)) : [[]];
  for (const changes of batches) {
    const response = await fetch(`${base}/api/sync`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ changes: changes.map((change) => change.receipt ? {
        ...change, receipt: (({ image: _localImage, ...receipt }) => receipt)(change.receipt),
      } : change) }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Sinkronisasi gagal');
    records = (body.records || []) as RemoteRecord[];
  }
  const sent = new Map(pending.map((x) => [x.id, x.updatedAt]));
  const latestQueue = await withQueueLock(async () => {
    const current = await queueRead();
    const remaining = current.filter((x) => sent.get(x.id) !== x.updatedAt);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    return remaining;
  });
  const result = new Map<string, Receipt>();
  const localMap = new Map(local.map((r) => [r.id, r]));
  for (const row of records) {
    if (row.deleted || !row.receipt) continue;
    const localReceipt = localMap.get(row.id);
    result.set(row.id, { ...row.receipt, ...(localReceipt?.image ? { image: localReceipt.image } : {}) });
  }
  for (const change of latestQueue) {
    if (change.deleted) result.delete(change.id);
    else if (change.receipt) result.set(change.id, change.receipt);
  }
  await AsyncStorage.setItem(OWNER_KEY, userId);
  return [...result.values()].sort((a, b) => b.createdAt - a.createdAt);
}
