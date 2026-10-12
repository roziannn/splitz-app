import Constants from 'expo-constants';

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
