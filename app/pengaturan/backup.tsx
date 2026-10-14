import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Text } from '../../components/Text';
import { Button, Card } from '../../components/ui';
import { saveBackupToFolder, shareBackup } from '../../lib/backupIO';
import { localIso } from '../../lib/dates';
import { useStore } from '../../lib/store';
import { useColors } from '../../lib/themeContext';
import { toast } from '../../lib/toast';

export default function Backup() {
  const C = useColors();
  const { receipts } = useStore();
  const [exporting, setExporting] = useState<'folder' | 'share' | null>(null);

  const exportExcel = async (mode: 'folder' | 'share') => {
    if (!receipts.length) return toast.error('Belum ada data untuk dibackup.');
    setExporting(mode);
    try {
      if (mode === 'share') {
        await shareBackup(receipts, localIso());
        toast.success('Backup siap dibagikan');
      } else {
        const name = await saveBackupToFolder(receipts, localIso());
        if (name) toast.success(`Backup tersimpan: ${name}`);
      }
    } catch (e: any) {
      toast.error(`Backup gagal: ${e?.message ?? 'coba lagi'}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Backup data</Text>
        <Text style={{ color: C.muted, marginBottom: 4 }}>
          Ekspor semua catatan ({receipts.length}) ke file Excel (.xlsx): struk, item, bensin, split bill, dan ringkasan kategori.
        </Text>
        <Text style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Foto struk tidak ikut. Di pemilih folder, pilih Documents atau folder buatan sendiri.</Text>
        <Button title="Simpan ke folder" onPress={() => exportExcel('folder')} loading={exporting === 'folder'} disabled={!!exporting} style={{ marginBottom: 8 }} />
        <Button title="Bagikan (Drive, WhatsApp, email)" kind="ghost" onPress={() => exportExcel('share')} loading={exporting === 'share'} disabled={!!exporting} />
      </Card>
    </ScrollView>
  );
}
