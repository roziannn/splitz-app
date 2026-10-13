import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Share, View } from 'react-native';
import { Text } from '../../../components/Text';
import { Button, Card, Chip, Field } from '../../../components/ui';
import { useFamily } from '../../../lib/family';
import { prettyDate, rupiah, uid } from '../../../lib/format';
import { computeSplit } from '../../../lib/split';
import { useStore } from '../../../lib/store';
import { useColors } from '../../../lib/themeContext';

export default function Split() {
  const C = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { get, upsert, flush } = useStore();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const family = useFamily();
  const isFamily = family.mode === 'keluarga';
  const r = get(id);
  if (!r) return <Text style={{ padding: 16 }}>Struk tidak ditemukan.</Text>;

  const addPerson = () => {
    const n = name.trim();
    if (!n) return;
    upsert({ ...r, people: [...r.people, { id: uid(), name: n }] });
    setName('');
  };
  const toggleMember = (m: { id: string; name: string }) =>
    r.people.some((p) => p.id === m.id) ? removePerson(m.id) : upsert({ ...r, people: [...r.people, { id: m.id, name: m.name }] });
  const allMembers = () => upsert({ ...r, people: [...r.people, ...family.members.filter((m) => !r.people.some((p) => p.id === m.id))] });
  const removePerson = (pid: string) =>
    upsert({
      ...r,
      people: r.people.filter((p) => p.id !== pid),
      items: r.items.map((i) => ({ ...i, assignedTo: i.assignedTo.filter((x) => x !== pid) })),
    });
  const toggle = (iid: string, pid: string) =>
    upsert({
      ...r,
      items: r.items.map((i) =>
        i.id !== iid ? i : { ...i, assignedTo: i.assignedTo.includes(pid) ? i.assignedTo.filter((x) => x !== pid) : [...i.assignedTo, pid] },
      ),
    });
  const everyone = (iid: string) =>
    upsert({ ...r, items: r.items.map((i) => (i.id === iid ? { ...i, assignedTo: r.people.map((p) => p.id) } : i)) });
  const splitEvenly = () => upsert({ ...r, items: r.items.map((i) => ({ ...i, assignedTo: r.people.map((p) => p.id) })) });

  const { shares, unassigned } = computeSplit(r);

  const save = async () => {
    setSaving(true);
    try {
      await flush();
      Alert.alert('Tersimpan', 'Split bill disimpan di Riwayat.', [
        { text: 'Tetap di sini', style: 'cancel' },
        { text: 'Lihat Riwayat', onPress: () => router.navigate('/history') },
      ]);
    } catch {
      Alert.alert('Gagal menyimpan', 'Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const share = async () => {
    await flush().catch(() => {});
    const lines = shares
      .filter((s) => s.total > 0)
      .map((s) => `• ${s.name}: ${rupiah(s.total)}`);
    Share.share({ message: `Split bill ${r.merchant} (${prettyDate(r.date)})\n${lines.join('\n')}\nTotal: ${rupiah(r.total)}` });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Text style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>Perubahan disimpan otomatis. Tekan Simpan untuk memastikan.</Text>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>{isFamily ? 'Anggota keluarga' : 'Peserta'}</Text>
        {isFamily ? (
          family.members.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {family.members.map((m) => (
                <Chip key={m.id} label={m.name} active={r.people.some((p) => p.id === m.id)} onPress={() => toggleMember(m)} />
              ))}
              {family.members.length > r.people.filter((p) => family.members.some((m) => m.id === p.id)).length ? (
                <Chip label="Semua" color={C.muted} onPress={allMembers} />
              ) : null}
            </View>
          ) : (
            <Text style={{ color: C.muted, marginBottom: 6 }}>Belum ada anggota. Tambahkan di Pengaturan → Mode, atau ketik nama di bawah.</Text>
          )
        ) : null}
        {r.people.filter((p) => !isFamily || !family.members.some((m) => m.id === p.id)).length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {r.people.filter((p) => !isFamily || !family.members.some((m) => m.id === p.id)).map((p) => (
              <Chip key={p.id} label={`${p.name}  ✕`} active onPress={() => removePerson(p.id)} />
            ))}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 6 }}>
          <View style={{ flex: 1 }}>
            <Field value={name} onChangeText={setName} placeholder={isFamily ? 'Tamu lain (opsional)' : 'Nama teman'} onSubmitEditing={addPerson} />
          </View>
          <Button title="Tambah" onPress={addPerson} />
        </View>
        {r.people.length > 1 ? <Button title="Bagi rata semua item" kind="ghost" onPress={splitEvenly} /> : null}
      </Card>

      {r.people.length ? (
        <>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Siapa makan apa? (ketuk nama)</Text>
          <Card style={{ paddingVertical: 4 }}>
            {r.items.map((i, k) => (
              <View key={i.id} style={{ paddingVertical: 10, borderTopWidth: k ? 1 : 0, borderTopColor: C.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontWeight: '600', flex: 1 }}>{i.name || 'Item'}{i.qty > 1 ? ` ×${i.qty}` : ''}</Text>
                  <Text>{rupiah(i.price)}</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {r.people.map((p) => (
                    <Chip key={p.id} label={p.name} active={i.assignedTo.includes(p.id)} onPress={() => toggle(i.id, p.id)} />
                  ))}
                  <Chip label="Semua" color={C.muted} onPress={() => everyone(i.id)} />
                </View>
              </View>
            ))}
          </Card>

          <Card>
            <Text style={{ fontWeight: '800', fontSize: 16, marginBottom: 8 }}>Ringkasan</Text>
            {shares.map((s) => (
              <View key={s.personId} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '700' }}>{s.name}</Text>
                  <Text style={{ fontWeight: '800', color: C.accent }}>{rupiah(s.total)}</Text>
                </View>
                {s.items.map((it, k) => (
                  <Text key={k} style={{ color: C.muted, fontSize: 12 }}>{it.name} · {rupiah(it.amount)}</Text>
                ))}
                {s.tax + s.service - s.discount !== 0 ? (
                  <Text style={{ color: C.muted, fontSize: 12 }}>Pajak/service/diskon · {rupiah(s.tax + s.service - s.discount)}</Text>
                ) : null}
              </View>
            ))}
            {unassigned > 0 ? <Text style={{ color: C.warn }}>Belum dibagi: {rupiah(unassigned)}</Text> : null}
          </Card>
          <Button title="Simpan" onPress={save} loading={saving} style={{ marginBottom: 10 }} />
          <Button title="Bagikan hasil" kind="ghost" onPress={share} />
        </>
      ) : null}
    </ScrollView>
  );
}
