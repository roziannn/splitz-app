import { Ionicons } from '@expo/vector-icons';
import { memo, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from './Text';
import { animate } from '../lib/anim';
import { useAllCategories } from '../lib/customCategories';
import { thousands, uid } from '../lib/format';
import { guessCategory } from '../lib/parse';
import { CAT_COLOR } from '../lib/theme';
import { useColors } from '../lib/themeContext';
import { Item } from '../lib/types';

const toNum = (t: string) => Number(t.replace(/\D/g, '').slice(0, 12)) || 0;

function Step({ name, onPress, enabled = true, label }: { name: keyof typeof Ionicons.glyphMap; onPress: () => void; enabled?: boolean; label: string }) {
  const C = useColors();
  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityLabel={label} style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={16} color={enabled ? C.text : C.border} />
    </Pressable>
  );
}

/** Satu baris item: nama dan harga di atas; jumlah dan kategori kecil di bawah (ketuk kategori untuk mengganti). */
const ItemRow = memo(function ItemRow({ item, first, onChange, onDelete }: { item: Item; first: boolean; onChange: (id: string, patch: Partial<Item>) => void; onDelete: (item: Item) => void }) {
  const C = useColors();
  const categories = useAllCategories();
  const [open, setOpen] = useState(false);
  const color = CAT_COLOR[item.category] ?? C.muted;
  return (
    <View style={{ paddingVertical: 10, borderTopWidth: first ? 0 : 1, borderTopColor: C.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          value={item.name}
          onChangeText={(t) => onChange(item.id, { name: t })}
          placeholder="Nama item"
          placeholderTextColor={C.muted}
          style={{ flex: 1, fontSize: 15, fontWeight: '600', color: C.text, paddingVertical: 4 }}
        />
        <Text style={{ color: C.muted, fontSize: 13 }}>Rp</Text>
        <TextInput
          value={thousands(item.price)}
          onChangeText={(t) => onChange(item.id, { price: toNum(t) })}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={C.muted}
          style={{ minWidth: 80, textAlign: 'right', fontSize: 15, fontWeight: '600', color: C.text, paddingVertical: 4 }}
        />
        <Pressable onPress={() => onDelete(item)} hitSlop={8} accessibilityLabel="Hapus item">
          <Ionicons name="close" size={20} color={C.muted} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <Step name="remove" label="Kurangi jumlah" enabled={item.qty > 1} onPress={() => onChange(item.id, { qty: Math.max(1, item.qty - 1) })} />
        <Text style={{ minWidth: 18, textAlign: 'center', fontWeight: '700' }}>{item.qty}</Text>
        <Step name="add" label="Tambah jumlah" onPress={() => onChange(item.id, { qty: item.qty + 1 })} />
        <Pressable onPress={() => { animate(); setOpen((o) => !o); }} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 6 }} />
          <Text style={{ fontSize: 12, color: C.muted }}>{item.category}</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} style={{ marginLeft: 2 }} />
        </Pressable>
      </View>

      {open ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {categories.map(({ name: c }) => {
            const active = item.category === c;
            return (
              <Pressable
                key={c}
                onPress={() => { animate(); onChange(item.id, { category: c }); setOpen(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6, marginBottom: 6, backgroundColor: active ? CAT_COLOR[c] : 'transparent', borderWidth: 1, borderColor: active ? CAT_COLOR[c] : C.border }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : C.text }}>{c}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
});

/** Semua item dalam satu kartu: baris ringkas, dan baris tambah cepat di paling bawah. */
export function ItemList({ items, onChange, onDelete, onAdd }: {
  items: Item[];
  onChange: (id: string, patch: Partial<Item>) => void;
  onDelete: (item: Item) => void;
  onAdd: (item: Item) => void;
}) {
  const C = useColors();
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
    <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, marginBottom: 12 }}>
      {items.map((i, k) => (
        <ItemRow key={i.id} item={i} first={k === 0} onChange={onChange} onDelete={onDelete} />
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: items.length ? 1 : 0, borderTopColor: C.border }}>
        <TextInput
          ref={nameRef}
          value={name}
          onChangeText={setName}
          onSubmitEditing={add}
          placeholder="+ Tambah item"
          placeholderTextColor={C.muted}
          returnKeyType="done"
          blurOnSubmit={false}
          style={{ flex: 1, fontSize: 15, color: C.text, paddingVertical: 8 }}
        />
        <Text style={{ color: C.muted, fontSize: 13 }}>Rp</Text>
        <TextInput
          value={thousands(price)}
          onChangeText={(t) => setPrice(toNum(t))}
          onSubmitEditing={add}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={C.muted}
          style={{ minWidth: 80, textAlign: 'right', fontSize: 15, color: C.text, paddingVertical: 8 }}
        />
        <Pressable onPress={add} disabled={!ready} hitSlop={6} accessibilityLabel="Tambah item" style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', opacity: ready ? 1 : 0.35 }}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
