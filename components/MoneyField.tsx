import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from './Text';
import { thousands } from '../lib/format';
import { Palette } from '../lib/theme';
import { useColors, useStyles } from '../lib/themeContext';

interface Props {
  label?: string;
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  prefix?: string; // default "Rp"; kosongkan untuk non-rupiah
  suffix?: string; // mis. "km"
  compact?: boolean; // tanpa jarak bawah (untuk dipakai di dalam baris)
}

const styles = (C: Palette) =>
  StyleSheet.create({
    label: { fontSize: 12, color: C.muted, marginBottom: 4, fontWeight: '600' },
    box: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: C.inputBg, paddingHorizontal: 12 },
    affix: { color: C.muted, fontWeight: '600', marginHorizontal: 2 },
    input: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, color: C.text, fontSize: 15 },
  });

/** Kolom angka dengan pemisah ribuan otomatis saat mengetik: 3000 -> 3.000. Nilainya tersimpan sebagai angka. */
export function MoneyField({ label, value, onChange, placeholder = '0', prefix = 'Rp', suffix, compact }: Props) {
  const C = useColors();
  const s = useStyles(styles);
  return (
    <View style={{ marginBottom: compact ? 0 : 10 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={s.box}>
        {prefix ? <Text style={s.affix}>{prefix}</Text> : null}
        <TextInput
          value={thousands(value)}
          onChangeText={(t) => onChange(Number(t.replace(/\D/g, '').slice(0, 12)) || 0)}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={C.muted}
          style={s.input}
        />
        {suffix ? <Text style={s.affix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}
