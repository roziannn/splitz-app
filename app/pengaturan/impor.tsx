import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../components/Text';
import { BottomBar, Button } from '../../components/ui';
import { useFamily } from '../../lib/family';
import { dedupe, parseBackup } from '../../lib/restore';
import { useStore } from '../../lib/store';
import { useColors } from '../../lib/themeContext';
import { toast } from '../../lib/toast';

interface Found {
  uri: string;
  name: string;
}

const nameOf = (uri: string) => decodeURIComponent(uri).split('/').pop() ?? uri;

export default function Impor() {
  const C = useColors();
  const { receipts, upsert } = useStore();
  const family = useFamily();
  const [files, setFiles] = useState<Found[] | null>(null);
  const [busy, setBusy] = useState(false);

  // Pilih folder lewat pemilih sistem, lalu tampilkan berkas .xlsx di dalamnya.
  const chooseFolder = async () => {
    try {
      const saf = FileSystem.StorageAccessFramework;
      const perm = await saf.requestDirectoryPermissionsAsync();
      if (!perm.granted) return;
      const all = await saf.readDirectoryAsync(perm.directoryUri);
      const found = all
        .map((uri) => ({ uri, name: nameOf(uri) }))
        .filter((f) => /\.xlsx$/i.test(f.name))
        .sort((a, b) => b.name.localeCompare(a.name));
      setFiles(found);
      if (!found.length) toast.info('Tidak ada berkas .xlsx di folder itu.');
    } catch (e: any) {
      toast.error(`Gagal membuka folder: ${e?.message ?? 'coba lagi'}`);
    }
  };

  const run = async (f: Found) => {
    setBusy(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(f.uri, { encoding: FileSystem.EncodingType.Base64 });
      const { receipts: parsed, warnings } = parseBackup(base64, family.members);
      const { fresh, skipped } = dedupe(parsed, receipts);
      fresh.forEach(upsert);
      toast.success(`${fresh.length} catatan dimasukkan${skipped ? `, ${skipped} sudah ada` : ''}${warnings.length ? `, ${warnings.length} dilewati` : ''}`);
    } catch (e: any) {
      toast.error(`Impor gagal: ${e?.message ?? 'berkas tidak terbaca'}`);
    } finally {
      setBusy(false);
    }
  };

  const confirm = (f: Found) =>
    Alert.alert('Impor data?', `${f.name}\n\nCatatan yang sudah ada tidak digandakan. Foto struk tidak ikut diimpor.`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Impor', onPress: () => run(f) },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {files === null ? (
          <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 16 }}>
            <MaterialCommunityIcons name="file-excel" size={64} color="#217346" />
            <Text style={{ fontWeight: '700', fontSize: 16, marginTop: 12 }}>Impor dari Excel</Text>
            <Text style={{ color: C.muted, textAlign: 'center', marginTop: 4 }}>
              Pilih folder tempat file ekspor Splitz (.xlsx) disimpan, lalu pilih filenya. Cocok untuk memulihkan data di HP baru.
            </Text>
          </View>
        ) : files.length ? (
          <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
            {files.map((f, i) => (
              <Pressable
                key={f.uri}
                onPress={() => confirm(f)}
                disabled={busy}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: C.border, opacity: busy ? 0.5 : 1 }}>
                <MaterialCommunityIcons name="file-excel" size={26} color="#217346" />
                <Text style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>{f.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={{ color: C.muted, textAlign: 'center', paddingVertical: 40 }}>Tidak ada berkas .xlsx di folder ini.</Text>
        )}
        {busy ? <ActivityIndicator style={{ marginTop: 16 }} color={C.accent} /> : null}
      </ScrollView>
      <BottomBar>
        <Button title={files === null ? 'Pilih folder' : 'Pilih folder lain'} onPress={chooseFolder} disabled={busy} style={{ flex: 1 }} />
      </BottomBar>
    </View>
  );
}
