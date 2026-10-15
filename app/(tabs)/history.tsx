import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { memo, useCallback, useDeferredValue, useMemo, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Image, PanResponder, Pressable, View } from 'react-native';
import { useAllCategories } from '../../lib/customCategories';
import { DateField, localIso } from '../../components/DateField';
import { Text } from '../../components/Text';
import { Empty } from '../../components/ui';
import { rupiah } from '../../lib/format';
import { imagePath } from '../../lib/images';
import { isClosedDate, useClosings } from '../../lib/closing';
import { editHref } from '../../lib/routes';
import { useStore } from '../../lib/store';
import { useColors } from '../../lib/themeContext';
import { toast } from '../../lib/toast';
import { Receipt } from '../../lib/types';

const PRESETS = ['Hari ini', '7 hari', '30 hari', 'Bulan ini', 'Semua'] as const;
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

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
/** "2026-10-15" -> "15 Okt 2026" */
const groupDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  const mi = Number(m) - 1;
  return BULAN[mi] ? `${Number(d)} ${BULAN[mi]} ${y}` : iso;
};

type ListItem = { kind: 'head'; date: string; count: number } | { kind: 'row'; r: Receipt };

interface RowProps {
  r: Receipt;
  onEdit: (r: Receipt) => void;
  onSplit: (id: string) => void;
  onDelete: (id: string, name: string, date: string) => void;
  locked: boolean;
  icon: string;
  tint: string;
}

const REVEAL = 96; // lebar tombol hapus yang muncul saat digeser ke kiri

// Dibungkus memo: baris yang datanya tidak berubah tidak digambar ulang saat daftar lain berubah.
const Row = memo(function Row({ r, onEdit, onSplit, onDelete, locked, icon, tint }: RowProps) {
  const C = useColors();
  const x = useRef(new Animated.Value(0)).current;
  const open = useRef(false);
  const settle = useCallback((to: number) => {
    open.current = to < 0;
    Animated.spring(x, { toValue: to, useNativeDriver: true, bounciness: 0, speed: 24 }).start();
  }, [x]);
  const startX = useRef(0);
  // Geser mendatar ke kiri membuka tombol hapus; geser balik atau ketuk baris untuk menutup.
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderGrant: () => { x.stopAnimation((v) => { startX.current = v; }); },
      onPanResponderMove: (_, g) => x.setValue(Math.min(0, Math.max(-REVEAL, startX.current + g.dx))),
      onPanResponderRelease: (_, g) => settle(startX.current + g.dx < -REVEAL / 2 ? -REVEAL : 0),
      onPanResponderTerminate: () => settle(open.current ? -REVEAL : 0),
    }),
  ).current;

  const press = () => (open.current ? settle(0) : onEdit(r));
  const del = () => {
    settle(0);
    onDelete(r.id, r.merchant, r.date);
  };

  // Tombol merah baru terlihat setelah baris mulai bergeser, jadi tidak tembus saat pindah menu.
  const actionOpacity = x.interpolate({ inputRange: [-12, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <View style={{ marginBottom: 10 }}>
      <Animated.View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: REVEAL - 8, opacity: actionOpacity }}>
        <Pressable
          onPress={del}
          accessibilityLabel="Hapus struk"
          style={{ flex: 1, borderRadius: 14, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 2 }}>Hapus</Text>
        </Pressable>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX: x }] }} {...pan.panHandlers}>
        <Pressable
          onPress={press}
          style={() => ({ backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'space-between', gap: 12 })}>
          {r.image ? (
            <View style={{ width: 52, height: 52 }}>
              <Image source={{ uri: imagePath(r.image) }} style={{ width: 52, height: 52, borderRadius: 8, backgroundColor: C.border }} />
              <Pressable
                onPress={() => onEdit(r)}
                hitSlop={8}
                accessibilityLabel="Edit struk"
                style={{ position: 'absolute', right: -6, bottom: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: tint, borderWidth: 2, borderColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={icon as any} size={12} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => onEdit(r)}
              hitSlop={8}
              accessibilityLabel="Edit struk"
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: tint + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={icon as any} size={18} color={tint} />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontWeight: '700', color: C.text }}>{r.merchant}</Text>
              {locked ? <Ionicons name="lock-closed" size={12} color={C.muted} /> : null}
            </View>
            <Text style={{ color: C.muted, fontSize: 12 }}>{r.items.length} item{r.people.length ? ` · split ${r.people.length} orang` : ''}</Text>
            {r.people.length ? (
              <Pressable onPress={() => onSplit(r.id)} hitSlop={6}>
                <Text style={{ color: C.accent, fontSize: 12, fontWeight: '600', marginTop: 2 }}>Lihat split bill ›</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={{ fontWeight: '800', color: C.accent }}>{rupiah(r.total)}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
});

export default function History() {
  const C = useColors();
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
  const { receipts: live, remove } = useStore();
  const closings = useClosings();
  const receipts = useDeferredValue(live); // daftar disusun dengan prioritas rendah agar layar lain tetap mulus
  const router = useRouter();
  const sorted = useMemo(
    () =>
      receipts
        .filter((r) => (!from || r.date >= from) && (!to || r.date <= to))
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [receipts, from, to],
  );

  const categories = useAllCategories();
  // Ikon kartu = kategori dengan total harga terbesar di struk itu.
  const catOf = useCallback(
    (r: Receipt) => {
      const sum: Record<string, number> = {};
      for (const i of r.items) sum[i.category] = (sum[i.category] ?? 0) + i.price;
      const top = Object.entries(sum).sort((a, b) => b[1] - a[1])[0]?.[0];
      const c = categories.find((k) => k.name === top) ?? categories.find((k) => k.name === 'Lainnya');
      return { icon: c?.icon ?? 'ellipsis-horizontal-circle-outline', tint: c?.color ?? C.accent };
    },
    [categories, C.accent],
  );
  const data = useMemo(() => {
    const out: ListItem[] = [];
    let head: { kind: 'head'; date: string; count: number } | undefined;
    for (const r of sorted) {
      if (!head || head.date !== r.date) {
        head = { kind: 'head', date: r.date, count: 0 };
        out.push(head);
      }
      head.count++;
      out.push({ kind: 'row', r });
    }
    return out;
  }, [sorted]);

  const locked = useCallback((date: string) => isClosedDate(date, closings), [closings]);
  const onEdit = useCallback(
    (r: Receipt) => (locked(r.date) ? toast.error('Periode ini sudah ditutup. Buka kembali di Laporan untuk mengubah.') : router.push(editHref(r) as any)),
    [router, locked],
  );
  const onSplit = useCallback((id: string) => router.push(`/receipt/split/${id}`), [router]);
  const onDelete = useCallback(
    (id: string, name: string, date: string) =>
      locked(date) ? toast.error('Periode ini sudah ditutup. Buka kembali di Laporan untuk menghapus.') : Alert.alert('Hapus riwayat?', `${name} akan dihapus dari riwayat.`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => { remove(id); toast.success('Riwayat dihapus'); } },
      ]),
    [remove, locked],
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg, paddingHorizontal: 16, paddingTop: 8 }}>
        {PRESETS.map((p) => {
          const active = preset === p && (p !== 'Semua' || (!from && !to));
          return (
            <Pressable key={p} onPress={() => pick(p)} accessibilityRole="tab" accessibilityState={{ selected: active }} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: active ? C.primary : 'transparent', marginBottom: -1 }}>
              <Text style={{ fontSize: 13, fontWeight: active ? '700' : '500', color: active ? C.accent : C.muted }} numberOfLines={1}>{p}</Text>
            </Pressable>
          );
        })}
      </View>
    <FlatList
      data={data}
      keyExtractor={(x) => (x.kind === 'head' ? 'h' + x.date : x.r.id)}
      contentContainerStyle={{ padding: 16, paddingTop: 12, flexGrow: 1 }}
      initialNumToRender={8}
      windowSize={7}
      removeClippedSubviews
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <DateField compact label="Dari" value={from} onChange={edit(setFrom)} placeholder="Dari tanggal" />
            </View>
            <View style={{ flex: 1 }}>
              <DateField compact label="Sampai" value={to} onChange={edit(setTo)} placeholder="Sampai tanggal" />
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={<Empty text={receipts.length ? 'Tidak ada struk di rentang tanggal ini.' : 'Belum ada struk.'} />}
      extraData={closings}
      renderItem={({ item }) =>
        item.kind === 'head' ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6, marginBottom: 8 }}>
            <Text style={{ fontWeight: '700', color: C.text }}>{groupDate(item.date)}</Text>
            <Text style={{ color: C.muted, fontSize: 12 }}>{item.count} transaksi pengeluaran</Text>
          </View>
        ) : (
          <Row r={item.r} onEdit={onEdit} onSplit={onSplit} onDelete={onDelete} locked={locked(item.r.date)} {...catOf(item.r)} />
        )
      }
    />
    </View>
  );
}
