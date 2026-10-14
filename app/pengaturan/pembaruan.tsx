import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { Text } from '../../components/Text';
import { Button, Card } from '../../components/ui';
import { useColors } from '../../lib/themeContext';
import { toast } from '../../lib/toast';
import { applyOtaUpdate, checkForUpdate, currentVersion, downloadAndInstallApk } from '../../lib/update';

export default function Pembaruan() {
  const C = useColors();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const update = async () => {
    setBusy(true);
    try {
      // 1) Pembaruan kode (OTA): otomatis terpasang dan aplikasi dimuat ulang.
      setStatus('Memeriksa pembaruan…');
      if (await applyOtaUpdate()) return;

      // 2) Versi APK baru: unduh di dalam aplikasi, lalu tinggal tekan "Pasang".
      const info = await checkForUpdate();
      if (!info.available || !info.apkUrl) {
        setStatus('');
        return toast.info(`Sudah versi terbaru (${currentVersion()})`);
      }
      const go = await new Promise<boolean>((resolve) =>
        Alert.alert(`Versi ${info.latest} tersedia`, info.notes || 'Unduh dan pasang sekarang?', [
          { text: 'Nanti', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Perbarui', onPress: () => resolve(true) },
        ]),
      );
      if (!go) return setStatus('');
      await downloadAndInstallApk(info.apkUrl, (p) => setStatus(`Mengunduh… ${Math.round(p * 100)}%`));
      setStatus('Tekan "Pasang" pada layar yang muncul.');
    } catch (e: any) {
      setStatus('');
      toast.error(`Gagal memperbarui: ${e?.message ?? 'coba lagi'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Pembaruan aplikasi</Text>
        <Text style={{ color: C.muted, marginBottom: 10 }}>Versi saat ini: {currentVersion()}</Text>
        {status ? <Text style={{ color: C.accent, marginBottom: 10 }}>{status}</Text> : null}
        <Button title="Perbarui sekarang" onPress={update} loading={busy} />
      </Card>
    </ScrollView>
  );
}
