import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Card, Chip, Empty } from '../../components/ui';
import { prettyDate, rupiah } from '../../lib/format';
import { useStore } from '../../lib/store';
import { CAT_COLOR, C } from '../../lib/theme';

type Range = 'day' | 'week' | 'month';

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export default function Report() {
  const { receipts } = useStore();
  const [range, setRange] = useState<Range>('week');

  const { total, byCat, byDay, count } = useMemo(() => {
    const from = range === 'day' ? daysAgo(0) : range === 'week' ? daysAgo(6) : daysAgo(29);
    const list = receipts.filter((r) => r.date >= from);
    const byCat: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    let total = 0;
    for (const r of list) {
      const sub = r.items.reduce((s, i) => s + i.price, 0) || 1;
      const extra = r.total - sub; // pajak/service/diskon dibagi proporsional ke kategori
      for (const i of r.items) byCat[i.category] = (byCat[i.category] || 0) + i.price + extra * (i.price / sub);
      byDay[r.date] = (byDay[r.date] || 0) + r.total;
      total += r.total;
    }
    return { total, byCat, byDay, count: list.length };
  }, [receipts, range]);

  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const days = Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        <Chip label="Hari ini" active={range === 'day'} onPress={() => setRange('day')} />
        <Chip label="7 hari" active={range === 'week'} onPress={() => setRange('week')} />
        <Chip label="30 hari" active={range === 'month'} onPress={() => setRange('month')} />
      </View>

      <Card style={{ backgroundColor: C.primary, borderColor: C.primary }}>
        <Text style={{ color: '#99f6e4' }}>Total pengeluaran</Text>
        <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>{rupiah(total)}</Text>
        <Text style={{ color: '#99f6e4' }}>{count} struk</Text>
      </Card>

      {!count ? (
        <Empty text="Belum ada pengeluaran pada periode ini. Scan struk pertamamu di tab Scan." />
      ) : (
        <>
          <Card>
            <Text style={{ fontWeight: '700', marginBottom: 10 }}>Per kategori</Text>
            {cats.map(([name, v]) => (
              <View key={name} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text>{name}</Text>
                  <Text style={{ fontWeight: '600' }}>{rupiah(v)} · {Math.round((v / total) * 100)}%</Text>
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: C.border, marginTop: 4 }}>
                  <View style={{ height: 8, borderRadius: 4, width: `${Math.max(2, (v / total) * 100)}%`, backgroundColor: CAT_COLOR[name] || C.muted }} />
                </View>
              </View>
            ))}
          </Card>
          <Card>
            <Text style={{ fontWeight: '700', marginBottom: 10 }}>Laporan harian</Text>
            {days.map(([d, v]) => (
              <View key={d} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <Text style={{ color: C.muted }}>{prettyDate(d)}</Text>
                <Text style={{ fontWeight: '600' }}>{rupiah(v)}</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}
