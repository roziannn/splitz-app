import { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { Button, Card } from '../../components/ui';
import { localIso } from '../../lib/dates';
import { saveBackupToFolder, shareBackup } from '../../lib/backupIO';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';
import { applyOtaUpdate, checkForUpdate, currentVersion, downloadAndInstallApk } from '../../lib/update';

export default function Settings() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const { receipts } = useStore();
  const [exporting, setExporting] = useState<'folder' | 'share' | null>(null);

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

  const exportExcel = async (mode: 'folder' | 'share') => {
    if (!receipts.length) return Alert.alert('Belum ada data', 'Catat pengeluaran dulu sebelum membuat backup.');
    setExporting(mode);
    try {
      if (mode === 'share') {
        await shareBackup(receipts, localIso());
      } else {
        const name = await saveBackupToFolder(receipts, localIso());
        if (name) Alert.alert('Backup tersimpan', `${name}\n\n${receipts.length} catatan disimpan di folder yang Anda pilih.`);
      }
    } catch (e: any) {
      Alert.alert('Backup gagal', e?.message ?? 'Coba lagi.');
    } finally {
      setExporting(null);
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
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Backup data</Text>
        <Text style={{ color: C.muted, marginBottom: 4 }}>
          Ekspor semua catatan ({receipts.length}) ke file Excel (.xlsx): struk, item, bensin, split bill, dan ringkasan kategori.
        </Text>
        <Text style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Foto struk tidak ikut. Di pemilih folder, pilih Documents atau folder buatan sendiri.</Text>
        <Button title="Simpan ke folder" onPress={() => exportExcel('folder')} loading={exporting === 'folder'} disabled={!!exporting} style={{ marginBottom: 8 }} />
        <Button title="Bagikan (Drive, WhatsApp, email)" kind="ghost" onPress={() => exportExcel('share')} loading={exporting === 'share'} disabled={!!exporting} />
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
