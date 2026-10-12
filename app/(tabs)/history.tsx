import { useRouter } from 'expo-router';
import { Alert, FlatList, Image, Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import { DateField, localIso } from '../../components/DateField';
import { Chip, Empty } from '../../components/ui';
import { prettyDate, rupiah } from '../../lib/format';
import { imagePath } from '../../lib/images';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';

const PRESETS = ['Semua', 'Hari ini', '7 hari', '30 hari', 'Bulan ini'] as const;
type Preset = (typeof PRESETS)[number];

const shiftDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localIso(d);
};

function presetRange(p: Preset): [string, string] {
  const t = localIso();
  if (p === 'Hari ini') return [t, t];
  if (p === '7 hari') return [shiftDays(6), t];
  if (p === '30 hari') return [shiftDays(29), t];
  if (p === 'Bulan ini') return [t.slice(0, 8) + '01', t];
  return ['', ''];
}

export default function History() {
  const [preset, setPreset] = useState<Preset>('Semua');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const pick = (p: Preset) => {
    const [f, t] = presetRange(p);
    setPreset(p);
    setFrom(f);
    setTo(t);
  };
  const edit = (set: (v: string) => void) => (v: string) => {
    setPreset('Semua');
    set(v);
  };
  const { receipts, remove } = useStore();
  const router = useRouter();
  const sorted = receipts
    .filter((r) => (!from || r.date >= from) && (!to || r.date <= to))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const confirmRemove = (id: string, name: string) =>
    Alert.alert('Hapus riwayat?', `${name} akan dihapus dari riwayat.`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => remove(id) },
    ]);
  return (
    <FlatList
      data={sorted}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {PRESETS.map((p) => (
              <Chip key={p} label={p} active={preset === p && (p !== 'Semua' || (!from && !to))} onPress={() => pick(p)} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <DateField label="Dari" value={from} onChange={edit(setFrom)} placeholder="Pilih tanggal" />
            </View>
            <View style={{ flex: 1 }}>
              <DateField label="Sampai" value={to} onChange={edit(setTo)} placeholder="Pilih tanggal" />
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={<Empty text={receipts.length ? 'Tidak ada struk di rentang tanggal ini.' : 'Belum ada struk.'} />}
      renderItem={({ item: r }) => (
        <Pressable
          onPress={() => router.push(`/receipt/${r.id}`)}
          onLongPress={() => confirmRemove(r.id, r.merchant)}
          style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          {r.image ? <Image source={{ uri: imagePath(r.image) }} style={{ width: 52, height: 52, borderRadius: 8, backgroundColor: C.border }} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: C.text }}>{r.merchant}</Text>
            <Text style={{ color: C.muted, fontSize: 12 }}>{prettyDate(r.date)} · {r.items.length} item{r.people.length ? ` · split ${r.people.length} orang` : ''}</Text>
            {r.people.length ? (
              <Pressable onPress={() => router.push(`/receipt/split/${r.id}`)} hitSlop={6}>
                <Text style={{ color: C.primary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>Lihat split bill ›</Text>
              </Pressable>
            ) : null}
            <Text style={{ color: C.muted, fontSize: 11 }}>Ketuk untuk edit · tahan untuk hapus</Text>
          </View>
          <Text style={{ fontWeight: '800', color: C.primary }}>{rupiah(r.total)}</Text>
        </Pressable>
      )}
    />
  );
}
