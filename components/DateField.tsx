import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../lib/theme';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const pad = (n: number) => String(n).padStart(2, '0');

/** YYYY-MM-DD menurut zona waktu perangkat (bukan UTC). */
export const localIso = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const parse = (iso: string) => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null;
};

const label = (iso: string) => {
  const p = parse(iso);
  return p ? `${p.d} ${MONTHS[p.m].slice(0, 3)} ${p.y}` : '';
};

interface Props {
  label: string;
  value: string; // '' = kosong
  onChange: (iso: string) => void;
  placeholder?: string;
}

export function DateField({ label: title, value, onChange, placeholder = 'Pilih tanggal' }: Props) {
  const [open, setOpen] = useState(false);
  const start = parse(value) ?? parse(localIso())!;
  const [year, setYear] = useState(start.y);
  const [month, setMonth] = useState(start.m);

  const show = () => {
    const s = parse(value) ?? parse(localIso())!;
    setYear(s.y);
    setMonth(s.m);
    setOpen(true);
  };
  const move = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const choose = (iso: string) => {
    onChange(iso);
    setOpen(false);
  };

  const offset = (new Date(year, month, 1).getDay() + 6) % 7; // minggu dimulai Senin
  const total = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const todayIso = localIso();

  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={s.label}>{title}</Text>
      <Pressable onPress={show} style={s.input}>
        <Text style={{ color: value ? C.text : C.muted }}>{value ? label(value) : placeholder}</Text>
        <Text style={{ color: C.muted }}>📅</Text>
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <View style={s.header}>
              <Pressable onPress={() => move(-1)} hitSlop={10}><Text style={s.nav}>‹</Text></Pressable>
              <Text style={{ fontWeight: '700', fontSize: 16, color: C.text }}>{MONTHS[month]} {year}</Text>
              <Pressable onPress={() => move(1)} hitSlop={10}><Text style={s.nav}>›</Text></Pressable>
            </View>

            <View style={s.row}>
              {DAYS.map((d) => (
                <Text key={d} style={[s.cell, { color: C.muted, fontSize: 12 }]}>{d}</Text>
              ))}
            </View>
            {Array.from({ length: cells.length / 7 }, (_, w) => (
              <View key={w} style={s.row}>
                {cells.slice(w * 7, w * 7 + 7).map((d, i) => {
                  if (!d) return <View key={i} style={s.cell} />;
                  const iso = `${year}-${pad(month + 1)}-${pad(d)}`;
                  const selected = iso === value;
                  return (
                    <Pressable key={i} onPress={() => choose(iso)} style={s.cell}>
                      <View style={[s.day, selected && { backgroundColor: C.primary }, !selected && iso === todayIso && { borderWidth: 1, borderColor: C.primary }]}>
                        <Text style={{ color: selected ? '#fff' : C.text, fontWeight: selected ? '700' : '400' }}>{d}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            <View style={[s.header, { marginTop: 8, marginBottom: 0 }]}>
              <Pressable onPress={() => choose('')} hitSlop={8}><Text style={{ color: C.danger, fontWeight: '600' }}>Hapus</Text></Pressable>
              <Pressable onPress={() => choose(todayIso)} hitSlop={8}><Text style={{ color: C.primary, fontWeight: '600' }}>Hari ini</Text></Pressable>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}><Text style={{ color: C.muted, fontWeight: '600' }}>Tutup</Text></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 12, color: C.muted, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: '#fff', borderRadius: 18, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  nav: { fontSize: 28, color: C.primary, paddingHorizontal: 10, lineHeight: 30 },
  row: { flexDirection: 'row' },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
