import { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { Button, Card } from '../../components/ui';
import { C } from '../../lib/theme';
import { applyOtaUpdate, checkForUpdate, currentVersion, downloadAndInstallApk } from '../../lib/update';

export default function Settings() {
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
        return Alert.alert('Sudah terbaru', `Anda memakai versi ${currentVersion()}.`);
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
      Alert.alert('Gagal memperbarui', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Pembaruan aplikasi</Text>
        <Text style={{ color: C.muted, marginBottom: 10 }}>Versi saat ini: {currentVersion()}</Text>
        {status ? <Text style={{ color: C.primary, marginBottom: 10 }}>{status}</Text> : null}
        <Button title="Perbarui sekarang" onPress={update} loading={busy} />
      </Card>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Tentang scan struk</Text>
        <Text style={{ color: C.muted }}>
          Struk dibaca langsung di HP (Google ML Kit) tanpa internet dan tanpa API key. Hasilnya bisa dikoreksi di halaman detail struk.
        </Text>
      </Card>
    </ScrollView>
  );
}
