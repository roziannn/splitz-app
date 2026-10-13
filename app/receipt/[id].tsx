import * as ImagePicker from 'expo-image-picker';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../components/Text';
import { DateField } from '../../components/DateField';
import { ItemCard, AddItem } from '../../components/ItemEditor';
import { MoneyField } from '../../components/MoneyField';
import { Button, Card, Field } from '../../components/ui';
import { rupiah } from '../../lib/format';
import { animate } from '../../lib/anim';
import { deleteReceiptImage, imagePath, saveReceiptImage } from '../../lib/images';
import { canSplit, editHref } from '../../lib/routes';
import { grandTotal, itemsSubtotal } from '../../lib/split';
import { useStore } from '../../lib/store';
import { useColors } from '../../lib/themeContext';
import { Item, Receipt } from '../../lib/types';

export default function ReceiptDetail() {
  const C = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { get, upsert, remove } = useStore();
  const [viewer, setViewer] = useState(false);
  const [undo, setUndo] = useState<{ item: Item; index: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const r = get(id);
  if (!r) return <Text style={{ padding: 16 }}>Struk tidak ditemukan.</Text>;
  if (r.source === 'bensin') return <Redirect href={editHref(r) as any} />;

  const save = (patch: Partial<Receipt>) => {
    const next = { ...r, ...patch };
    next.total = grandTotal(next);
    upsert(next);
  };
  const setItem = (iid: string, patch: Partial<Item>) => save({ items: r.items.map((i) => (i.id === iid ? { ...i, ...patch } : i)) });

  // Hapus langsung tanpa dialog; ada waktu 5 detik untuk mengurungkan.
  const deleteItem = (item: Item) => {
    animate();
    const index = r.items.findIndex((x) => x.id === item.id);
    save({ items: r.items.filter((x) => x.id !== item.id) });
    setUndo({ item, index });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setUndo(null), 5000);
  };
  const restoreItem = () => {
    if (!undo) return;
    animate();
    const items = [...r.items];
    items.splice(Math.min(undo.index, items.length), 0, undo.item);
    save({ items });
    setUndo(null);
    if (timer.current) clearTimeout(timer.current);
  };

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
    <View style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }} keyboardShouldPersistTaps="handled">
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

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: C.text }}>Item ({r.items.length})</Text>
        <Text style={{ color: C.muted }}>Subtotal {rupiah(itemsSubtotal(r))}</Text>
      </View>
      {r.items.length === 0 ? (
        <Text style={{ color: C.muted, marginBottom: 12 }}>Belum ada item. Tambahkan di bawah.</Text>
      ) : null}
      {r.items.map((i) => (
        <ItemCard key={i.id} item={i} onChange={(patch) => setItem(i.id, patch)} onDelete={() => deleteItem(i)} />
      ))}
      <AddItem onAdd={(item) => { animate(); save({ items: [...r.items, item] }); }} />

      <Card>
        <MoneyField label="Pajak" value={r.tax} onChange={(n) => save({ tax: n })} />
        <MoneyField label="Service charge" value={r.service} onChange={(n) => save({ service: n })} />
        <MoneyField label="Diskon" value={r.discount} onChange={(n) => save({ discount: n })} />
        <Text style={{ color: C.muted }}>Subtotal {rupiah(itemsSubtotal(r))}</Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: C.accent }}>Total {rupiah(r.total)}</Text>
      </Card>

      {canSplit(r) ? (
        <Button
          title={r.people.length ? `Lihat / ubah Split Bill (${r.people.length} orang)` : 'Split Bill'}
          onPress={() => router.push(`/receipt/split/${r.id}`)}
          style={{ marginBottom: 10 }}
        />
      ) : null}
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

    {undo ? (
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, backgroundColor: C.snackBg, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 6 }}>
        <Text style={{ color: C.snackText }} numberOfLines={1}>{undo.item.name ? `"${undo.item.name}" dihapus` : 'Item dihapus'}</Text>
        <Pressable onPress={restoreItem} hitSlop={10}>
          <Text style={{ color: C.snackAction, fontWeight: '800' }}>URUNGKAN</Text>
        </Pressable>
      </View>
    ) : null}
    </View>
  );
}
