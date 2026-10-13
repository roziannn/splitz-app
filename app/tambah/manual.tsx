import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { Text } from '../../components/Text';
import { AddCategorySheet } from '../../components/AddCategorySheet';
import { DateField } from '../../components/DateField';
import { evaluate, display, hasOperator, press } from '../../lib/calc';
import { isCustom, removeCategory, useAllCategories } from '../../lib/customCategories';
import { localIso } from '../../lib/dates';
import { prettyDate, rupiah, uid } from '../../lib/format';
import { useStore } from '../../lib/store';
import { useColors } from '../../lib/themeContext';

const ROWS = [
  ['7', '8', '9', 'DATE'],
  ['4', '5', '6', '+'],
  ['1', '2', '3', ',', '-'],
  ['0', '000', '⌫', 'OK'],
];

export default function Manual() {
  const C = useColors();
  const router = useRouter();
  const { upsert } = useStore();
  const [category, setCategory] = useState<string | null>(null);
  const [expr, setExpr] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(localIso());
  const categories = useAllCategories();
  const [adding, setAdding] = useState(false);
  const [split, setSplit] = useState(false);

  const calculating = hasOperator(expr);
  const amount = evaluate(expr);

  const save = () => {
    if (!category || amount <= 0) return;
    const id = uid();
    upsert({
      id,
      merchant: category,
      date,
      items: [{ id: uid(), name: note.trim() || category, qty: 1, price: amount, category, assignedTo: [] }],
      tax: 0,
      service: 0,
      discount: 0,
      total: amount,
      people: [],
      createdAt: Date.now(),
      source: 'manual',
    });
    if (split) router.replace(`/receipt/split/${id}`); // lanjut pilih siapa membayar apa
    else router.back();
  };

  const onKey = (k: string) => {
    if (k === 'OK') {
      if (calculating) setExpr(String(amount)); // tombol "=": hitung dulu, ketuk lagi untuk simpan
      else save();
    } else setExpr((e) => press(e, k));
  };

  const keyBox = { flex: 1, height: 52, margin: 3, borderRadius: 8, backgroundColor: C.key, alignItems: 'center' as const, justifyContent: 'center' as const };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 96 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {categories.map((c) => {
            const active = category === c.name;
            return (
              <Pressable
                key={c.name}
                onPress={() => setCategory(c.name)}
                onLongPress={() => {
                  if (!isCustom(c.name)) return;
                  Alert.alert(`Hapus kategori "${c.name}"?`, 'Catatan yang sudah ada tetap memakai nama ini.', [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Hapus', style: 'destructive', onPress: () => { removeCategory(c.name); if (category === c.name) setCategory(null); } },
                  ]);
                }}
                style={{ width: '25%', alignItems: 'center', paddingVertical: 8 }}>
                <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: active ? c.color : C.chipBg, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={c.icon} size={28} color={active ? '#fff' : C.chipIcon} />
                </View>
                <Text style={{ fontSize: 12, color: C.text, marginTop: 4, textAlign: 'center', fontWeight: active ? '700' : '400' }} numberOfLines={2}>{c.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => setAdding(true)}
        accessibilityLabel="Tambah kategori"
        style={({ pressed }) => ({ position: 'absolute', right: 16, bottom: 16, width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, opacity: pressed ? 0.85 : 1 })}>
        <Ionicons name="add" size={32} color="#fff" />
      </Pressable>
      </View>

      <AddCategorySheet visible={adding} onClose={() => setAdding(false)} onAdded={(name) => setCategory(name)} />

      {category ? (
        <View style={{ backgroundColor: C.keypadBg, padding: 8, paddingBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 6 }}>
            <Text style={{ color: C.muted, fontWeight: '600' }}>{category}</Text>
            <Text style={{ fontSize: 30, fontWeight: '600', color: C.text }} numberOfLines={1} adjustsFontSizeToFit>{display(expr)}</Text>
          </View>
          {calculating ? <Text style={{ textAlign: 'right', color: C.muted, marginBottom: 4, paddingRight: 6 }}>= {rupiah(amount)}</Text> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 8, paddingHorizontal: 12, marginBottom: 6 }}>
            <Text style={{ color: C.muted }}>Catatan :</Text>
            <TextInput value={note} onChangeText={setNote} placeholder="Masukkan catatan..." placeholderTextColor={C.placeholder} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: C.text }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="people-outline" size={18} color={C.muted} />
              <Text style={{ color: C.text }}>Split bill setelah simpan</Text>
            </View>
            <Switch value={split} onValueChange={setSplit} trackColor={{ true: C.primary, false: C.border }} thumbColor="#fff" />
          </View>
          {ROWS.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row' }}>
              {row.map((k) => {
                if (k === 'DATE') {
                  return (
                    <View key={k} style={{ flex: 1 }}>
                      <DateField label="Tanggal" value={date} onChange={(v) => v && setDate(v)} trigger={(open) => (
                        <Pressable onPress={open} style={keyBox}>
                          <Ionicons name="calendar-outline" size={18} color={C.accent} />
                          <Text style={{ color: C.accent, fontSize: 12, fontWeight: '600' }}>{date === localIso() ? 'Hari ini' : prettyDate(date)}</Text>
                        </Pressable>
                      )} />
                    </View>
                  );
                }
                const ok = k === 'OK';
                return (
                  <Pressable key={k} onPress={() => onKey(k)} disabled={ok && !calculating && amount <= 0} style={[keyBox, ok && { backgroundColor: amount > 0 || calculating ? C.primary : C.keyDisabled }]}>
                    {k === '⌫' ? <Ionicons name="backspace-outline" size={26} color={C.text} />
                      : ok ? <Ionicons name={calculating ? 'return-down-back' : 'checkmark'} size={28} color="#fff" />
                      : <Text style={{ fontSize: 24, color: C.text }}>{k === '-' ? '−' : k}</Text>}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      ) : (
        <Text style={{ textAlign: 'center', color: C.muted, padding: 14 }}>Pilih kategori untuk mengisi nominal.</Text>
      )}
    </KeyboardAvoidingView>
  );
}
