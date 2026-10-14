import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './Text';
import { BottomBar, Button } from './ui';
import { animate } from '../lib/anim';
import { useColors } from '../lib/themeContext';

const SLIDES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: 'add-circle-outline', title: 'Catat dengan cepat', body: 'Buka tab Catat, lalu pilih cara mencatat: scan struk, input manual, atau bensin.' },
  { icon: 'scan-outline', title: 'Scan struk otomatis', body: 'Foto struknya. Item, harga, dan pajak terbaca di HP tanpa internet. Periksa hasilnya, lalu koreksi bila perlu.' },
  { icon: 'people-outline', title: 'Split bill', body: 'Bagi tagihan ke teman atau keluarga. Pajak dan service dibagi sesuai porsi, hasilnya bisa dibagikan lewat pesan.' },
  { icon: 'stats-chart-outline', title: 'Laporan dan tutup buku', body: 'Lihat tren dan kategori pengeluaran. Di tab Semua, tutup buku untuk mengunci satu periode.' },
  { icon: 'shield-checkmark-outline', title: 'Data ada di HP Anda', body: 'Tidak ada akun dan tidak ada server. Simpan cadangan lewat Pengaturan, Ekspor data, dan pulihkan lewat Impor data.' },
];

/** Panduan singkat beberapa layar. Dipakai saat pertama dibuka dan dari ikon tanda tanya di Laporan. */
export function Onboarding({ onDone, doneLabel = 'Mulai' }: { onDone: () => void; doneLabel?: string }) {
  const C = useColors();
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  const s = SLIDES[i];
  const go = (n: number) => { animate(); setI(n); };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16, minHeight: 52 }}>
        {!last ? (
          <Pressable onPress={onDone} hitSlop={10}>
            <Text style={{ color: C.muted, fontWeight: '600' }}>Lewati</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={s.icon} size={56} color={C.accent} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 28, textAlign: 'center' }}>{s.title}</Text>
        <Text style={{ color: C.muted, fontSize: 15, lineHeight: 22, marginTop: 10, textAlign: 'center' }}>{s.body}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 32 }}>
          {SLIDES.map((_, k) => (
            <View key={k} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: k === i ? C.primary : C.border }} />
          ))}
        </View>
      </View>
      <BottomBar>
        {i > 0 ? <Button title="Kembali" kind="ghost" onPress={() => go(i - 1)} style={{ flex: 1 }} /> : null}
        <Button title={last ? doneLabel : 'Lanjut'} onPress={last ? onDone : () => go(i + 1)} style={{ flex: 2 }} />
      </BottomBar>
    </View>
  );
}
