import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ChartBoundary, Donut, LineChart } from '../../components/charts';
import { Card, Chip, Empty } from '../../components/ui';
import { prettyDate, rupiah } from '../../lib/format';
import { buildReport, Range } from '../../lib/report';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';

const RANGES: { key: Range; label: string; long: string }[] = [
  { key: 'day', label: 'Hari ini', long: 'hari ini' },
  { key: 'week', label: '7 hari', long: '7 hari terakhir' },
  { key: 'month', label: '30 hari', long: '30 hari terakhir' },
];

function Tile({ label, value, sub, subColor }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 12 }}>
      <Text style={{ color: C.muted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: C.text, fontSize: 17, fontWeight: '800', marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub ? <Text style={{ color: subColor ?? C.muted, fontSize: 11, marginTop: 2 }}>{sub}</Text> : null}
    </View>
  );
}

export default function Dashboard() {
  const { receipts } = useStore();
  const [range, setRange] = useState<Range>('week');
  const rep = useMemo(() => buildReport(receipts, range), [receipts, range]);
  const meta = RANGES.find((r) => r.key === range)!;
  const top = rep.byCat[0];
  const days = [...rep.series].reverse().filter((d) => d.value > 0);

  // Pengeluaran naik = merah (kurang baik), turun = hijau.
  const deltaText =
    rep.delta === null
      ? rep.total > 0 ? 'Belum ada pembanding' : undefined
      : `${rep.delta > 0 ? '▲' : rep.delta < 0 ? '▼' : '•'} ${Math.abs(rep.delta).toFixed(0)}% vs periode lalu`;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {RANGES.map((r) => (
          <Chip key={r.key} label={r.label} active={range === r.key} onPress={() => setRange(r.key)} />
        ))}
      </View>

      <Card style={{ backgroundColor: C.primary, borderColor: C.primary }}>
        <Text style={{ color: '#ccfbf1' }}>Total pengeluaran · {meta.long}</Text>
        <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800', marginVertical: 2 }}>{rupiah(rep.total)}</Text>
        {deltaText ? <Text style={{ color: '#ccfbf1', fontWeight: '600' }}>{deltaText}</Text> : null}
      </Card>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <Tile label="Jumlah struk" value={String(rep.count)} />
        <Tile label="Rata-rata / hari" value={rupiah(rep.avgPerDay)} />
        <Tile label="Terbesar" value={top ? top.name : '-'} sub={top ? `${top.pct.toFixed(0)}% total` : undefined} />
      </View>

      {!rep.count ? (
        <Empty text="Belum ada pengeluaran pada periode ini. Scan struk di tab Scan." />
      ) : (
        <>
          <Card>
            <Text style={{ fontWeight: '700', marginBottom: 2 }}>Tren pengeluaran</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>
              Total per hari · {range === 'day' ? '7 hari terakhir' : meta.long}. Ketuk grafik untuk melihat nilainya.
            </Text>
            <ChartBoundary>
              <LineChart points={rep.series} />
            </ChartBoundary>
          </Card>

          <Card>
            <Text style={{ fontWeight: '700', marginBottom: 10 }}>Pengeluaran per kategori</Text>
            <ChartBoundary note="Grafik donat tampil setelah aplikasi diperbarui ke versi terbaru (build APK baru).">
              <Donut slices={rep.byCat} total={rep.total} />
            </ChartBoundary>
          </Card>

          <Card>
            <Text style={{ fontWeight: '700', marginBottom: 6 }}>Laporan harian</Text>
            {days.map((d) => (
              <View key={d.date} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <Text style={{ color: C.muted }}>{prettyDate(d.date)}</Text>
                <Text style={{ fontWeight: '600', color: C.text }}>{rupiah(d.value)}</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}
