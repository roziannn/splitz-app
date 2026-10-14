import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { DateField, localIso } from '../../components/DateField';
import { Text } from '../../components/Text';
import { Button, Card, Chip } from '../../components/ui';
import { countInRange, ExportFormat, exportShare, exportToFolder } from '../../lib/backupIO';
import { useFamily } from '../../lib/family';
import { useStore } from '../../lib/store';
import { useColors } from '../../lib/themeContext';
import { toast } from '../../lib/toast';

const monthBounds = (offset: number): [string, string] => {
  const d = new Date();
  return [localIso(new Date(d.getFullYear(), d.getMonth() + offset, 1)), localIso(new Date(d.getFullYear(), d.getMonth() + offset + 1, 0))];
};

const FORMATS: { key: ExportFormat; label: string; sub: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }[] = [
  { key: 'xlsx', label: 'Excel', sub: '.xlsx', icon: 'file-excel', color: '#217346' },
  { key: 'pdf', label: 'PDF', sub: '.pdf', icon: 'file-pdf-box', color: '#d93025' },
];

export default function EksporData() {
  const C = useColors();
  const { receipts } = useStore();
  const family = useFamily();
  const [from, setFrom] = useState(() => monthBounds(0)[0]);
  const [to, setTo] = useState(() => monthBounds(0)[1]);
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [busy, setBusy] = useState<'folder' | 'share' | null>(null);

  const count = useMemo(() => countInRange(receipts, from, to), [receipts, from, to]);
  const all = useMemo(() => {
    const dates = receipts.map((r) => r.date).sort();
    return [dates[0] ?? localIso(), dates[dates.length - 1] ?? localIso()] as [string, string];
  }, [receipts]);
  const [thisM, lastM] = [monthBounds(0), monthBounds(-1)];
  const is = (r: [string, string]) => from === r[0] && to === r[1];
  const set = (r: [string, string]) => { setFrom(r[0]); setTo(r[1]); };

  const problem = !from || !to ? 'Pilih tanggal dari dan sampai.' : to < from ? 'Tanggal akhir harus setelah tanggal mulai.' : !count ? 'Tidak ada catatan pada rentang ini.' : '';

  const run = async (mode: 'folder' | 'share') => {
    if (problem) return toast.error(problem);
    setBusy(mode);
    try {
      const input = { format, receipts, from, to, members: family.mode === 'keluarga' ? family.members : [] };
      if (mode === 'share') {
        await exportShare(input);
      } else {
        const name = await exportToFolder(input);
        if (name) toast.success(`Tersimpan: ${name}`);
      }
    } catch (e: any) {
      toast.error(`Ekspor gagal: ${e?.message ?? 'coba lagi'}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>Rentang tanggal</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Chip label="Bulan ini" active={is(thisM)} onPress={() => set(thisM)} />
          <Chip label="Bulan lalu" active={is(lastM)} onPress={() => set(lastM)} />
          <Chip label="Semua" active={is(all)} onPress={() => set(all)} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <DateField label="Dari" value={from} onChange={setFrom} />
          </View>
          <View style={{ flex: 1 }}>
            <DateField label="Sampai" value={to} onChange={setTo} />
          </View>
        </View>
        <Text style={{ color: problem ? C.danger : C.muted, fontSize: 12 }}>{problem || `${count} catatan akan diekspor.`}</Text>
      </Card>

      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 10 }}>Format</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {FORMATS.map((f) => {
            const active = format === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFormat(f.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, borderColor: active ? f.color : C.border, backgroundColor: active ? f.color + '1f' : 'transparent' }}>
                <MaterialCommunityIcons name={f.icon} size={40} color={f.color} />
                <Text style={{ marginTop: 4, fontWeight: '700' }}>{f.label}</Text>
                <Text style={{ color: C.muted, fontSize: 12 }}>{f.sub}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ color: C.muted, fontSize: 12, marginTop: 10 }}>
          {format === 'xlsx' ? 'Struk, item, bensin, split bill, dan ringkasan kategori. Foto struk tidak ikut.' : 'Laporan siap cetak: ringkasan, per kategori, per anggota (mode Keluarga), dan rincian tiap catatan.'}
        </Text>
      </Card>

      <Button title="Simpan ke folder" onPress={() => run('folder')} loading={busy === 'folder'} disabled={!!busy || !!problem} style={{ marginBottom: 8 }} />
      <Button title="Bagikan atau cetak" kind="ghost" onPress={() => run('share')} loading={busy === 'share'} disabled={!!busy || !!problem} />
    </ScrollView>
  );
}
