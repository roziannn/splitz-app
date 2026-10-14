import * as ImagePicker from 'expo-image-picker';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../components/Text';
import { ClosedNotice } from '../../components/ClosedNotice';
import { DateField } from '../../components/DateField';
import { ItemList } from '../../components/ItemEditor';
import { MoneyField } from '../../components/MoneyField';
import { BottomBar, Button, Card, Field } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { rupiah } from '../../lib/format';
import { animate } from '../../lib/anim';
import { deleteReceiptImage, imagePath, saveReceiptImage } from '../../lib/images';
import { canSplit, editHref } from '../../lib/routes';
import { grandTotal, itemsSubtotal } from '../../lib/split';
import { useStore } from '../../lib/store';
import { useColors } from '../../lib/themeContext';
import { toast } from '../../lib/toast';
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
    if (!perm.granted) return toast.error('Izin ditolak. Berikan izin di pengaturan perangkat.');
    const res = await (camera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync)({ mediaTypes: ['images'], quality: 0.9 });
    if (res.canceled) return;
    const name = await saveReceiptImage(res.assets[0].uri, r.id);
    if (!name) return toast.error('Foto tidak bisa disimpan.');
    await deleteReceiptImage(r.image);
    save({ image: name });
    toast.success('Foto disimpan');
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
      { text: 'Hapus', style: 'destructive', onPress: async () => { await deleteReceiptImage(r.image); save({ image: undefined }); toast.info('Foto dihapus'); } },
    ]);

  return (
    <View style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
      {r.image ? (
        <View style={{ marginBottom: 12 }}>
          <Pressable onPress={() => setViewer(true)}>
            <Image source={{ uri: imagePath(r.image) }} style={{ width: '100%', height: 160, borderRadius: 14, backgroundColor: C.border }} resizeMode="cover" />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 18, marginTop: 8 }}>
            <Pressable onPress={choosePhoto} hitSlop={8}><Text style={{ color: C.accent, fontWeight: '600' }}>Ganti foto</Text></Pressable>
            <Pressable onPress={removePhoto} hitSlop={8}><Text style={{ color: C.muted, fontWeight: '600' }}>Hapus foto</Text></Pressable>
          </View>
        </View>
      ) : null}

      <Card>
        <Field label="Toko" value={r.merchant} onChangeText={(t) => save({ merchant: t })} />
        <DateField label="Tanggal" value={r.date} onChange={(v) => v && save({ date: v })} />
        <ClosedNotice date={r.date} />
      </Card>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: C.text }}>Item ({r.items.length})</Text>
        <Text style={{ color: C.muted }}>Subtotal {rupiah(itemsSubtotal(r))}</Text>
      </View>
      <ItemList
        items={r.items}
        onChange={setItem}
        onDelete={deleteItem}
        onAdd={(item) => { animate(); save({ items: [...r.items, item] }); }}
      />

      <Card>
        <MoneyField label="Pajak" value={r.tax} onChange={(n) => save({ tax: n })} />
        <MoneyField label="Service charge" value={r.service} onChange={(n) => save({ service: n })} />
        <MoneyField label="Diskon" value={r.discount} onChange={(n) => save({ discount: n })} />
        <Text style={{ color: C.muted }}>Subtotal {rupiah(itemsSubtotal(r))}</Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: C.accent }}>Total {rupiah(r.total)}</Text>
      </Card>

      {!r.image ? (
        <Pressable onPress={choosePhoto} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border }}>
          <Ionicons name="camera-outline" size={18} color={C.muted} />
          <Text style={{ color: C.muted, fontWeight: '600' }}>Tambah foto struk</Text>
        </Pressable>
      ) : null}

      <Modal visible={viewer} transparent animationType="fade" onRequestClose={() => setViewer(false)}>
        <Pressable onPress={() => setViewer(false)} style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
          <Image source={{ uri: imagePath(r.image) }} style={{ width: '100%', height: '90%' }} resizeMode="contain" />
          <Text style={{ color: '#fff', textAlign: 'center', position: 'absolute', bottom: 24, width: '100%' }}>Ketuk untuk menutup</Text>
        </Pressable>
      </Modal>
    </ScrollView>

    <BottomBar>
      <Pressable
        onPress={() =>
          Alert.alert('Hapus struk?', 'Tindakan ini tidak bisa dibatalkan.', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus', style: 'destructive', onPress: () => { remove(r.id); toast.success('Struk dihapus'); router.back(); } },
          ])
        }
        accessibilityLabel="Hapus struk"
        style={{ width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: C.danger, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="trash-outline" size={22} color={C.danger} />
      </Pressable>
      {canSplit(r) ? (
        <Button
          title={r.people.length ? `Split Bill (${r.people.length} orang)` : 'Split Bill'}
          onPress={() => router.push(`/receipt/split/${r.id}`)}
          style={{ flex: 1 }}
        />
      ) : null}
    </BottomBar>

    {undo ? (
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 84, backgroundColor: C.snackBg, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 6 }}>
        <Text style={{ color: C.snackText }} numberOfLines={1}>{undo.item.name ? `"${undo.item.name}" dihapus` : 'Item dihapus'}</Text>
        <Pressable onPress={restoreItem} hitSlop={10}>
          <Text style={{ color: C.snackAction, fontWeight: '800' }}>URUNGKAN</Text>
        </Pressable>
      </View>
    ) : null}
    </View>
  );
}
