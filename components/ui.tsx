import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Text } from './Text';
import { Palette } from '../lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useStyles } from '../lib/themeContext';

const styles = (C: Palette) =>
  StyleSheet.create({
    btn: { minHeight: 48, paddingVertical: 13, paddingHorizontal: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    card: {
      backgroundColor: C.card, borderRadius: 22, padding: 16, marginBottom: 14,
      borderWidth: 1, borderColor: C.border,
      shadowColor: C.primary, shadowOffset: { width: 0, height: 8 },
      shadowOpacity: C.dark ? 0.12 : 0.075, shadowRadius: 18, elevation: C.dark ? 2 : 3,
    },
    label: { fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: '700', letterSpacing: 0.25 },
    input: { borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.inputBg, color: C.text },
    chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginRight: 6, marginBottom: 6 },
  });

export function Button({ title, onPress, kind = 'primary', loading, disabled, style }: {
  title: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger'; loading?: boolean; disabled?: boolean; style?: ViewStyle;
}) {
  const C = useColors();
  const s = useStyles(styles);
  const bg = kind === 'primary' ? C.primary : kind === 'danger' ? C.danger : C.primarySoft;
  const color = kind === 'ghost' ? C.accent : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [s.btn, {
        backgroundColor: bg,
        opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
        borderWidth: kind === 'ghost' ? 1 : 0,
        borderColor: kind === 'ghost' ? C.border : bg,
        shadowColor: kind === 'primary' ? C.primary : 'transparent',
        shadowOffset: { width: 0, height: 5 }, shadowOpacity: kind === 'primary' && !C.dark ? 0.2 : 0,
        shadowRadius: 9, elevation: kind === 'primary' ? 2 : 0,
      }, style]}>
      {loading ? <ActivityIndicator color={color} /> : <Text style={{ color, fontWeight: '700' }}>{title}</Text>}
    </Pressable>
  );
}

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => {
  const s = useStyles(styles);
  return <View style={[s.card, style]}>{children}</View>;
};

export const Field = (p: TextInputProps & { label?: string }) => {
  const C = useColors();
  const s = useStyles(styles);
  return (
    <View style={{ marginBottom: 10 }}>
      {p.label ? <Text style={s.label}>{p.label}</Text> : null}
      <TextInput placeholderTextColor={C.muted} {...p} style={[s.input, p.style]} />
    </View>
  );
};

export const Chip = ({ label, active, color, onPress }: { label: string; active?: boolean; color?: string; onPress?: () => void }) => {
  const C = useColors();
  const s = useStyles(styles);
  const c = color ?? C.accent;
  return (
    <Pressable onPress={onPress} style={[s.chip, { borderColor: active ? (color ?? C.primary) : C.border, backgroundColor: active ? (color ?? C.primary) : C.chipBg }]}>
      <Text style={{ color: active ? '#fff' : c, fontWeight: '600', fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
};

export const Empty = ({ text }: { text: string }) => {
  const C = useColors();
  return (
    <View style={{ alignItems: 'center', padding: 32 }}>
      <Text style={{ color: C.muted, textAlign: 'center' }}>{text}</Text>
    </View>
  );
};

/** Bilah aksi yang menempel di bawah layar: tombol utama selalu terjangkau jempol. */
export const BottomBar = ({ children }: { children: React.ReactNode }) => {
  const C = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 + insets.bottom, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, shadowColor: C.primary, shadowOffset: { width: 0, height: -4 }, shadowOpacity: C.dark ? 0 : 0.06, shadowRadius: 12, elevation: 8 }}>
      {children}
    </View>
  );
};
