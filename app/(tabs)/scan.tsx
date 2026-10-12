import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, Text } from 'react-native';
import { Button, Card } from '../../components/ui';
import { scanReceipt } from '../../lib/ocr';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';
import { uid, today } from '../../lib/format';

export default function Scan() {
  const router = useRouter();
  const { upsert } = useStore();
  const [uri, setUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Izin ditolak', 'Berikan izin akses di pengaturan perangkat.');
    const res = await (camera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync)({ mediaTypes: ['images'], quality: 0.9 });
    if (!res.canceled) setUri(res.assets[0].uri);
  };

  const run = async () => {
    if (!uri) return;
    setBusy(true);
    try {
      const r = await scanReceipt(uri);
      upsert(r);
      setUri(null);
      router.push(`/receipt/${r.id}`);
    } catch (e: any) {
      Alert.alert('Gagal memindai', e.message);
    } finally {
      setBusy(false);
    }
  };

  const manual = () => {
    const id = uid();
    upsert({ id, merchant: 'Struk manual', date: today(), items: [], tax: 0, service: 0, discount: 0, total: 0, people: [], createdAt: Date.now() });
    router.push(`/receipt/${id}`);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Text style={{ fontSize: 18, fontWeight: '800', color: C.text }}>Scan struk dengan AI</Text>
        <Text style={{ color: C.muted, marginTop: 4 }}>
          Foto struk belanja, AI akan membaca item, harga, pajak, lalu mengkategorikannya otomatis.
        </Text>
      </Card>
      {uri ? <Image source={{ uri }} style={{ width: '100%', height: 360, borderRadius: 16, marginBottom: 12 }} resizeMode="contain" /> : null}
      <Button title="📷  Ambil foto struk" onPress={() => pick(true)} style={{ marginBottom: 10 }} />
      <Button title="🖼️  Pilih dari galeri" kind="ghost" onPress={() => pick(false)} style={{ marginBottom: 10 }} />
      {uri ? <Button title="Ekstrak data struk" onPress={run} loading={busy} style={{ marginBottom: 10 }} /> : null}
      <Button title="Input manual" kind="ghost" onPress={manual} />
    </ScrollView>
  );
}
