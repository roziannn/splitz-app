import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Text } from './Text';
import { isClosedDate, useClosings } from '../lib/closing';
import { useColors } from '../lib/themeContext';

/** Catatan kecil bila tanggal jatuh di periode yang sudah ditutup buku. */
export function ClosedNotice({ date }: { date: string }) {
  const C = useColors();
  const closings = useClosings();
  if (!date || !isClosedDate(date, closings)) return null;
  const c = closings.find((x) => date >= x.from && date <= x.to);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.primarySoft, borderRadius: 10, padding: 10, marginTop: 4, marginBottom: 6 }}>
      <Ionicons name="lock-closed" size={14} color={C.accent} style={{ marginTop: 2 }} />
      <Text style={{ flex: 1, color: C.muted, fontSize: 12, lineHeight: 17 }}>
        Tanggal ini masuk periode {c?.label ?? 'yang sudah ditutup'}. Catatan tetap tersimpan, tetapi tidak ikut dalam ringkasan tutup buku. Buka kembali periodenya di Laporan bila perlu.
      </Text>
    </View>
  );
}
