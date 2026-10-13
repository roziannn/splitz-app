import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { DateField, localIso } from '../components/DateField';
import { Text } from '../components/Text';
import { Button, Card, Chip, Field } from '../components/ui';
import { closeBook, summarize, useClosings } from '../lib/closing';
import { useFamily } from '../lib/family';
import { prettyDate, rupiah } from '../lib/format';
import { useStore } from '../lib/store';
import { CAT_COLOR } from '../lib/theme';
import { useColors } from '../lib/themeContext';
import { toast } from '../lib/toast';

const monthBounds = (offset: number): [string, string] => {
  const d = new Date();
  const first = new Date(d.getFullYear(), d.getMonth() + offset, 1);
  const last = new Date(d.getFullYear(), d.getMonth() + offset + 1, 0);
  return [localIso(first), localIso(last)];
};

const monthName = (iso: string) => {
  const [y, m] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

export default function TutupBuku() {
  const C = useColors();
  const router = useRouter();
  const { receipts } = useStore();
  const family = useFamily();
  const closings = useClosings();

  const [initFrom, initTo] = monthBounds(0);
  const [from, setFrom] = useState(initFrom);
  const [to, setTo] = useState(initTo);
  const [label, setLabel] = useState<string | null>(null); // null = ikuti bulan dari tanggal mulai
  const name = label ?? (from ? monthName(from) : '');

  const sum = useMemo(
    () => (from && to && to >= from ? summarize(receipts, from, to, family.mode === 'keluarga' ? family.members : []) : null),
    [receipts, from, to, family],
  );
  const clash = from && to ? closings.find((c) => from <= c.to && to >= c.from) : undefined;
  const problem = !from || !to ? 'Pilih tanggal mulai dan akhir.' : to < from ? 'Tanggal akhir harus setelah tanggal mulai.' : clash ? `Bertumpuk dengan periode "${clash.label}".` : sum && !sum.count ? 'Tidak ada catatan pada periode ini.' : '';

  const pickMonth = (offset: number) => {
    const [f, t] = monthBounds(offset);
    setFrom(f);
    setTo(t);
    setLabel(null);
  };

  const submit = () => {
    const err = closeBook({ label: name, from, to }, receipts, family.mode === 'keluarga' ? family.members : []);
    if (err) return toast.error(err);
    toast.success(`Buku ${name} ditutup`);
    router.back();
  };
  const confirm = () =>
    Alert.alert('Tutup buku?', `${prettyDate(from)} – ${prettyDate(to)}\n\nCatatan pada periode ini dikunci dan tidak bisa diubah atau dihapus. Anda bisa membukanya kembali dari halaman Laporan.`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Tutup buku', onPress: submit },
    ]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>Periode</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Chip label="Bulan ini" active={from === monthBounds(0)[0] && to === monthBounds(0)[1]} onPress={() => pickMonth(0)} />
          <Chip label="Bulan lalu" active={from === monthBounds(-1)[0] && to === monthBounds(-1)[1]} onPress={() => pickMonth(-1)} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <DateField label="Mulai" value={from} onChange={(v) => { setFrom(v); setLabel(null); }} />
          </View>
          <View style={{ flex: 1 }}>
            <DateField label="Akhir" value={to} onChange={setTo} />
          </View>
        </View>
        <Text style={{ color: C.muted, fontSize: 12 }}>Bisa diatur bebas, mis. 25 Okt sampai 24 Nov bila gajian di tanggal 25.</Text>
      </Card>

      <Card>
        <Field label="Nama periode" value={name} onChangeText={setLabel} placeholder="mis. Oktober 2026" />
        {sum ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ color: C.muted }}>{sum.count} catatan</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: C.accent }}>{rupiah(sum.total)}</Text>
            </View>
            {sum.byCat.slice(0, 5).map((c) => (
              <View key={c.name} style={{ paddingTop: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text>{c.name}</Text>
                  <Text style={{ color: C.muted }}>{rupiah(c.value)} · {c.pct.toFixed(0)}%</Text>
                </View>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: C.border, marginTop: 4 }}>
                  <View style={{ height: 4, borderRadius: 2, backgroundColor: CAT_COLOR[c.name] ?? C.primary, width: `${Math.max(2, c.pct)}%` }} />
                </View>
              </View>
            ))}
            {sum.byPerson.length ? (
              <View style={{ marginTop: 14 }}>
                <Text style={{ fontWeight: '700', marginBottom: 4 }}>Per anggota</Text>
                {sum.byPerson.map((p) => (
                  <View key={p.name} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text>{p.name}</Text>
                    <Text>{rupiah(p.amount)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
        {problem ? <Text style={{ color: C.danger, marginTop: 10 }}>{problem}</Text> : null}
      </Card>

      <Button title="Tutup buku" onPress={confirm} disabled={!!problem} />
    </ScrollView>
  );
}
