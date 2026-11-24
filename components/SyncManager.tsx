import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { useAuth } from '../lib/auth';
import { syncAccount } from '../lib/sync';
import { useStore } from '../lib/store';

/** Sync antrean lokal saat ada koneksi, saat data berubah, dan saat aplikasi kembali aktif. */
export function SyncManager() {
  const { user, token } = useAuth();
  const { receipts, ready, replaceAll } = useStore();
  const current = useRef({ receipts, replaceAll });
  const running = useRef(false);
  const rerun = useRef(false);
  useEffect(() => { current.current = { receipts, replaceAll }; }, [receipts, replaceAll]);

  useEffect(() => {
    if (!user || !token || !ready) return;
    let mounted = true;
    const run = async () => {
      const net = await NetInfo.fetch();
      if (!mounted || net.isConnected === false || net.isInternetReachable === false) return;
      if (running.current) { rerun.current = true; return; }
      running.current = true;
      try {
        const data = current.current;
        const remote = await syncAccount(token, user.id, data.receipts);
        if (!mounted) return;
        if (JSON.stringify(remote) !== JSON.stringify(data.receipts)) await data.replaceAll(remote);
      } catch {
        // Perubahan tetap di antrean lokal; percobaan berikutnya berjalan saat koneksi pulih/layar dibuka.
      } finally {
        running.current = false;
        if (rerun.current && mounted) { rerun.current = false; void run(); }
      }
    };
    const timer = setTimeout(() => { void run(); }, 500);
    const netSub = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) void run();
    });
    const appSub = AppState.addEventListener('change', (state) => { if (state === 'active') void run(); });
    return () => { mounted = false; clearTimeout(timer); netSub(); appSub.remove(); };
  }, [user?.id, token, ready, receipts]);
  return null;
}
