import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { DateField } from '../../components/DateField';
import { Button, Card, Chip, Field } from '../../components/ui';
import { parseNum, rupiah, uid } from '../../lib/format';
import { deleteReceiptImage, imagePath, saveReceiptImage } from '../../lib/images';
import { grandTotal, itemsSubtotal } from '../../lib/split';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';
import { CATEGORIES, Item, Receipt } from '../../lib/types';

export default function ReceiptDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { get, upsert, remove } = useStore();
  const [viewer, setViewer] = useState(false);
  const r = get(id);
  if (!r) return <Text style={{ padding: 16 }}>Struk tidak ditemukan.</Text>;

  const save = (patch: Partial<Receipt>) => {
    const next = { ...r, ...patch };
    next.total = grandTotal(next);
    upsert(next);
  };
  const setItem = (iid: string, patch: Partial<Item>) => save({ items: r.items.map((i) => (i.id === iid ? { ...i, ...patch } : i)) });

  const pickPhoto = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Izin ditolak', 'Berikan izin akses di pengaturan perangkat.');
    const res = await (camera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync)({ mediaTypes: ['images'], quality: 0.9 });
    if (res.canceled) return;
    const name = await saveReceiptImage(res.assets[0].uri, r.id);
    if (!name) return Alert.alert('Gagal', 'Foto tidak bisa disimpan.');
    await deleteReceiptImage(r.image);
    save({ image: name });
  };
  const choosePhoto = () =>
    Alert.alert('Foto struk', undefined, [
      { text: 'Kamera', onPress: () => pickPhoto(true) },
      { text: 'Galeri', onPress: () => pickPhoto(false) },
      { text: 'Batal', style: 'cancel' },
    ]);
  const removePhoto = () =>
    Alert.alert('Hapus foto?', 'Data struk tetap tersimpan.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => { await deleteReceiptImage(r.image); save({ image: undefined }); } },
    ]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      {r.image ? (
        <Card>
          <Pressable onPress={() => setViewer(true)}>
            <Image source={{ uri: imagePath(r.image) }} style={{ width: '100%', height: 200, borderRadius: 12, backgroundColor: C.border }} resizeMode="cover" />
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Ketuk gambar untuk memperbesar</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Button title="Ganti foto" kind="ghost" onPress={choosePhoto} style={{ flex: 1 }} />
            <Button title="Hapus foto" kind="ghost" onPress={removePhoto} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        <Button title="📷  Tambah foto struk" kind="ghost" onPress={choosePhoto} style={{ marginBottom: 12 }} />
      )}

      <Card>
        <Field label="Toko" value={r.merchant} onChangeText={(t) => save({ merchant: t })} />
        <DateField label="Tanggal" value={r.date} onChange={(v) => v && save({ date: v })} />
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

      <Button
        title={r.people.length ? `Lihat / ubah Split Bill (${r.people.length} orang)` : 'Split Bill'}
        onPress={() => router.push(`/receipt/split/${r.id}`)}
        style={{ marginBottom: 10 }}
      />
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

      <Modal visible={viewer} transparent animationType="fade" onRequestClose={() => setViewer(false)}>
        <Pressable onPress={() => setViewer(false)} style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
          <Image source={{ uri: imagePath(r.image) }} style={{ width: '100%', height: '90%' }} resizeMode="contain" />
          <Text style={{ color: '#fff', textAlign: 'center', position: 'absolute', bottom: 24, width: '100%' }}>Ketuk untuk menutup</Text>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
