import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Tile } from '../../components/Tile';
import { localIso } from '../../lib/dates';
import { uid } from '../../lib/format';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';

export default function Catat() {
  const router = useRouter();
  const { upsert } = useStore();

  const manual = () => {
    const id = uid();
    upsert({ id, merchant: 'Pengeluaran', date: localIso(), items: [], tax: 0, service: 0, discount: 0, total: 0, people: [], createdAt: Date.now(), source: 'manual' });
    router.push(`/receipt/${id}`);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: C.text }}>Catat pengeluaran</Text>
      <Text style={{ color: C.muted, marginTop: 4, marginBottom: 16 }}>Pilih cara mencatat.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <Tile icon="scan" title="Scan struk" desc="Foto struk, data terisi otomatis. Bisa split bill." onPress={() => router.push('/tambah/scan')} />
        <Tile icon="create-outline" title="Input manual" desc="Isi item dan harga sendiri." color="#6250d6" onPress={manual} />
        <Tile icon="speedometer-outline" title="Bensin" desc="Liter, harga per liter, dan odometer." color="#eb6834" onPress={() => router.push('/tambah/bensin')} />
      </View>
    </ScrollView>
  );
}
