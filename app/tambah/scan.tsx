import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, View } from 'react-native';
import { Text } from '../../components/Text';
import { BottomBar, Button } from '../../components/ui';
import { saveReceiptImage } from '../../lib/images';
import { scanReceipt } from '../../lib/ocr';
import { useStore } from '../../lib/store';
import { useColors } from '../../lib/themeContext';
import { toast } from '../../lib/toast';

export default function Scan() {
  const C = useColors();
  const router = useRouter();
  const { upsert } = useStore();
  const [uri, setUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast.error('Izin ditolak. Berikan izin di pengaturan perangkat.');
    const res = await (camera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync)({ mediaTypes: ['images'], quality: 0.9 });
    if (!res.canceled) setUri(res.assets[0].uri);
  };

  const run = async () => {
    if (!uri) return;
    setBusy(true);
    try {
      const r = await scanReceipt(uri);
      const image = await saveReceiptImage(uri, r.id); // simpan foto agar bisa dilihat lagi
      upsert({ ...r, source: 'scan', ...(image ? { image } : {}) });
      toast.success('Struk terbaca. Periksa hasilnya.');
      router.replace(`/receipt/${r.id}`);
    } catch (e: any) {
      toast.error(`Gagal memindai: ${e?.message ?? 'coba lagi'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        {uri ? (
          <Image source={{ uri }} style={{ flex: 1, borderRadius: 16 }} resizeMode="contain" />
        ) : (
          <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
            <Ionicons name="scan-outline" size={64} color={C.muted} />
            <Text style={{ fontWeight: '700', fontSize: 16, marginTop: 12 }}>Foto struk belanja</Text>
            <Text style={{ color: C.muted, textAlign: 'center', marginTop: 4 }}>Item, harga, pajak, dan kategori terisi otomatis. Hasilnya bisa dikoreksi.</Text>
          </View>
        )}
      </View>
      <BottomBar>
        {uri ? (
          <>
            <Button title="Ganti foto" kind="ghost" onPress={() => setUri(null)} disabled={busy} style={{ flex: 1 }} />
            <Button title="Ekstrak data" onPress={run} loading={busy} style={{ flex: 2 }} />
          </>
        ) : (
          <>
            <Button title="Galeri" kind="ghost" onPress={() => pick(false)} style={{ flex: 1 }} />
            <Button title="Ambil foto" onPress={() => pick(true)} style={{ flex: 2 }} />
          </>
        )}
      </BottomBar>
    </View>
  );
}
