import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Button, Card, Chip, Field } from '../../components/ui';
import { parseNum, rupiah, uid } from '../../lib/format';
import { grandTotal, itemsSubtotal } from '../../lib/split';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';
import { CATEGORIES, Item, Receipt } from '../../lib/types';

export default function ReceiptDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { get, upsert, remove } = useStore();
  const r = get(id);
  if (!r) return <Text style={{ padding: 16 }}>Struk tidak ditemukan.</Text>;

  const save = (patch: Partial<Receipt>) => {
    const next = { ...r, ...patch };
    next.total = grandTotal(next);
    upsert(next);
  };
  const setItem = (iid: string, patch: Partial<Item>) => save({ items: r.items.map((i) => (i.id === iid ? { ...i, ...patch } : i)) });

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Card>
        <Field label="Toko" value={r.merchant} onChangeText={(t) => save({ merchant: t })} />
        <Field label="Tanggal (YYYY-MM-DD)" value={r.date} onChangeText={(t) => save({ date: t })} />
      </Card>

      {r.items.map((i) => (
        <Card key={i.id}>
          <Field label="Nama item" value={i.name} onChangeText={(t) => setItem(i.id, { name: t })} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 70 }}>
              <Field label="Qty" keyboardType="numeric" value={String(i.qty)} onChangeText={(t) => setItem(i.id, { qty: parseNum(t) || 1 })} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Harga total (Rp)" keyboardType="numeric" value={i.price ? String(i.price) : ''} onChangeText={(t) => setItem(i.id, { price: parseNum(t) })} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {CATEGORIES.map((c) => (
              <Chip key={c} label={c} active={i.category === c} onPress={() => setItem(i.id, { category: c })} />
            ))}
          </View>
          <Button title="Hapus item" kind="ghost" onPress={() => save({ items: r.items.filter((x) => x.id !== i.id) })} />
        </Card>
      ))}
      <Button
        title="+ Tambah item"
        kind="ghost"
        style={{ marginBottom: 12 }}
        onPress={() => save({ items: [...r.items, { id: uid(), name: '', qty: 1, price: 0, category: 'Lainnya', assignedTo: [] }] })}
      />

      <Card>
        <Field label="Pajak (Rp)" keyboardType="numeric" value={r.tax ? String(r.tax) : ''} onChangeText={(t) => save({ tax: parseNum(t) })} />
        <Field label="Service charge (Rp)" keyboardType="numeric" value={r.service ? String(r.service) : ''} onChangeText={(t) => save({ service: parseNum(t) })} />
        <Field label="Diskon (Rp)" keyboardType="numeric" value={r.discount ? String(r.discount) : ''} onChangeText={(t) => save({ discount: parseNum(t) })} />
        <Text style={{ color: C.muted }}>Subtotal {rupiah(itemsSubtotal(r))}</Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: C.primary }}>Total {rupiah(r.total)}</Text>
      </Card>

      <Button title="Split Bill" onPress={() => router.push(`/receipt/split/${r.id}`)} style={{ marginBottom: 10 }} />
      <Button
        title="Hapus struk"
        kind="danger"
        onPress={() =>
          Alert.alert('Hapus struk?', 'Tindakan ini tidak bisa dibatalkan.', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus', style: 'destructive', onPress: () => { remove(r.id); router.back(); } },
          ])
        }
      />
    </ScrollView>
  );
}
