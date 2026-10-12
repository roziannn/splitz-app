import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system/legacy';

const REPO = 'roziannn/splitz-app';

export const currentVersion = () => Constants.expoConfig?.version ?? '0.0.0';

const parts = (v: string) => v.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);

/** true jika a lebih baru dari b */
export function isNewer(a: string, b: string) {
  const x = parts(a), y = parts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d) return d > 0;
  }
  return false;
}

export interface UpdateInfo {
  available: boolean;
  latest: string;
  apkUrl?: string;
  notes?: string;
}

export async function checkForUpdate(): Promise<UpdateInfo> {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (res.status === 404) return { available: false, latest: currentVersion() };
  if (!res.ok) throw new Error(`Gagal mengecek pembaruan (${res.status})`);
  const rel = await res.json();
  const latest: string = String(rel.tag_name ?? '').replace(/^v/, '');
  const apk = (rel.assets ?? []).find((a: any) => String(a.name).endsWith('.apk'));
  return {
    available: !!apk && isNewer(latest, currentVersion()),
    latest,
    apkUrl: apk?.browser_download_url,
    notes: rel.body || undefined,
  };
}

// ---------- Pembaruan sekali klik ----------

/** OTA: ganti kode JS tanpa pasang ulang APK. Mengembalikan true jika pembaruan terunduh (aplikasi akan dimuat ulang). */
export async function applyOtaUpdate(): Promise<boolean> {
  if (__DEV__ || !Updates.isEnabled) return false;
  const check = await Updates.checkForUpdateAsync();
  if (!check.isAvailable) return false;
  await Updates.fetchUpdateAsync();
  await Updates.reloadAsync();
  return true;
}

/** Unduh APK di dalam aplikasi lalu buka pemasang Android (tinggal tekan "Pasang"). */
export async function downloadAndInstallApk(url: string, onProgress?: (pct: number) => void) {
  const dest = FileSystem.cacheDirectory + 'Splitz-update.apk';
  await FileSystem.deleteAsync(dest, { idempotent: true });
  const task = FileSystem.createDownloadResumable(url, dest, {}, (p) => {
    if (p.totalBytesExpectedToWrite > 0) onProgress?.(p.totalBytesWritten / p.totalBytesExpectedToWrite);
  });
  const res = await task.downloadAsync();
  if (!res || res.status !== 200) throw new Error('Gagal mengunduh APK.');
  const contentUri = await FileSystem.getContentUriAsync(res.uri);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    type: 'application/vnd.android.package-archive',
  });
}
