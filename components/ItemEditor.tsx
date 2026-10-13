import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { guessCategory } from '../lib/parse';
import { uid } from '../lib/format';
import { C, CAT_COLOR } from '../lib/theme';
import { MANUAL_CATEGORIES } from '../lib/categories';
import { Item } from '../lib/types';
import { MoneyField } from './MoneyField';

const IconButton = ({ name, color, onPress, label }: { name: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void; label: string }) => (
  <Pressable
    onPress={onPress}
    hitSlop={8}
    accessibilityLabel={label}
    style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? C.border : 'transparent' })}>
    <Ionicons name={name} size={20} color={color} />
  </Pressable>
);

/** Satu item: nama, jumlah (− / +), harga total, kategori, dan tombol hapus. */
export function ItemCard({ item, onChange, onDelete }: { item: Item; onChange: (patch: Partial<Item>) => void; onDelete: () => void }) {
  const color = CAT_COLOR[item.category] ?? C.muted;
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 10, overflow: 'hidden' }}>
      <View style={{ height: 3, backgroundColor: color }} />
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            value={item.name}
            onChangeText={(t) => onChange({ name: t })}
            placeholder="Nama item"
            placeholderTextColor={C.muted}
            style={{ flex: 1, fontSize: 16, fontWeight: '700', color: C.text, paddingVertical: 4 }}
          />
          <IconButton name="trash-outline" color={C.danger} onPress={onDelete} label="Hapus item" />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 8 }}>
          <View>
            <Text style={{ fontSize: 12, color: C.muted, marginBottom: 4, fontWeight: '600' }}>Jumlah</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 10, height: 42 }}>
              <IconButton name="remove" color={item.qty > 1 ? C.text : C.border} onPress={() => onChange({ qty: Math.max(1, item.qty - 1) })} label="Kurangi jumlah" />
              <Text style={{ minWidth: 22, textAlign: 'center', fontWeight: '700', color: C.text }}>{item.qty}</Text>
              <IconButton name="add" color={C.text} onPress={() => onChange({ qty: item.qty + 1 })} label="Tambah jumlah" />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <MoneyField compact label="Harga total" value={item.price} onChange={(n) => onChange({ price: n })} />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ marginTop: 10 }}>
          {MANUAL_CATEGORIES.map(({ name: c }) => {
            const active = item.category === c;
            return (
              <Pressable
                key={c}
                onPress={() => onChange({ category: c })}
                style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6, backgroundColor: active ? CAT_COLOR[c] : C.bg, borderWidth: 1, borderColor: active ? CAT_COLOR[c] : C.border }}>
                {!active ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: CAT_COLOR[c], marginRight: 6 }} /> : null}
                <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : C.text }}>{c}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

/** Tambah cepat: ketik nama dan harga, tekan Tambah. Kategori ditebak dari nama, bisa diubah setelahnya. */
export function AddItem({ onAdd }: { onAdd: (item: Item) => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const nameRef = useRef<TextInput>(null);
  const ready = name.trim().length > 0 || price > 0;

  const add = () => {
    if (!ready) return;
    const n = name.trim();
    onAdd({ id: uid(), name: n, qty: 1, price, category: n ? guessCategory(n) : 'Lainnya', assignedTo: [] });
    setName('');
    setPrice(0);
    nameRef.current?.focus(); // siap mengetik item berikutnya
  };

  return (
    <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.primary, borderRadius: 16, padding: 12, marginBottom: 12, backgroundColor: C.primarySoft + '55' }}>
      <Text style={{ fontWeight: '700', color: C.primary, marginBottom: 8 }}>Tambah item</Text>
      <TextInput
        ref={nameRef}
        value={name}
        onChangeText={setName}
        placeholder="Nama item, mis. Nasi goreng"
        placeholderTextColor={C.muted}
        returnKeyType="done"
        style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, color: C.text, marginBottom: 10 }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MoneyField compact value={price} onChange={setPrice} placeholder="Harga" />
        </View>
        <Pressable
          onPress={add}
          disabled={!ready}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 16, height: 44, opacity: !ready ? 0.4 : pressed ? 0.85 : 1 })}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700' }}>Tambah</Text>
        </Pressable>
      </View>
    </View>
  );
}
