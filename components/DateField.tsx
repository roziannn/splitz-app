import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { localIso } from '../lib/dates';
import { Palette } from '../lib/theme';
import { useColors, useStyles } from '../lib/themeContext';

export { localIso };

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const pad = (n: number) => String(n).padStart(2, '0');

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
  /** Tanpa label di atas dan tanpa ikon kalender; hanya teks tanggal atau placeholder. */
  compact?: boolean;
  /** Ganti kolom bawaan dengan tombol sendiri; tetap membuka kalender yang sama. */
  trigger?: (open: () => void) => React.ReactNode;
}

export function DateField({ label: title, value, onChange, placeholder = 'Pilih tanggal', compact, trigger }: Props) {
  const C = useColors();
  const s = useStyles(styles);
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
    <View style={trigger ? undefined : { marginBottom: compact ? 0 : 10 }}>
      {trigger ? (
        trigger(show)
      ) : (
        <>
          {compact ? null : <Text style={s.label}>{title}</Text>}
          <Pressable onPress={show} style={s.input}>
            <Text style={{ color: value ? C.text : C.muted }}>{value ? label(value) : placeholder}</Text>
            {compact ? null : <Text style={{ color: C.muted }}>📅</Text>}
          </Pressable>
        </>
      )}

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
                      <View style={[s.day, selected && { backgroundColor: C.primary }, !selected && iso === todayIso && { borderWidth: 1, borderColor: C.accent }]}>
                        <Text style={{ color: selected ? '#fff' : C.text, fontWeight: selected ? '700' : '400' }}>{d}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            <View style={[s.header, { marginTop: 8, marginBottom: 0 }]}>
              <Pressable onPress={() => choose('')} hitSlop={8}><Text style={{ color: C.danger, fontWeight: '600' }}>Hapus</Text></Pressable>
              <Pressable onPress={() => choose(todayIso)} hitSlop={8}><Text style={{ color: C.accent, fontWeight: '600' }}>Hari ini</Text></Pressable>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}><Text style={{ color: C.muted, fontWeight: '600' }}>Tutup</Text></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = (C: Palette) => StyleSheet.create({
  label: { fontSize: 12, color: C.muted, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: C.inputBg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backdrop: { flex: 1, backgroundColor: C.overlay, justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: C.card, borderRadius: 18, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  nav: { fontSize: 28, color: C.accent, paddingHorizontal: 10, lineHeight: 30 },
  row: { flexDirection: 'row' },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
