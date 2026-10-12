import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { C } from '../lib/theme';

export function Button({ title, onPress, kind = 'primary', loading, disabled, style }: {
  title: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger'; loading?: boolean; disabled?: boolean; style?: ViewStyle;
}) {
  const bg = kind === 'primary' ? C.primary : kind === 'danger' ? C.danger : 'transparent';
  const color = kind === 'ghost' ? C.primary : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1, borderWidth: kind === 'ghost' ? 1 : 0, borderColor: C.primary }, style]}>
      {loading ? <ActivityIndicator color={color} /> : <Text style={{ color, fontWeight: '700' }}>{title}</Text>}
    </Pressable>
  );
}

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[s.card, style]}>{children}</View>
);

export const Field = (p: TextInputProps & { label?: string }) => (
  <View style={{ marginBottom: 10 }}>
    {p.label ? <Text style={s.label}>{p.label}</Text> : null}
    <TextInput placeholderTextColor={C.muted} {...p} style={[s.input, p.style]} />
  </View>
);

export const Chip = ({ label, active, color = C.primary, onPress }: { label: string; active?: boolean; color?: string; onPress?: () => void }) => (
  <Pressable onPress={onPress} style={[s.chip, { borderColor: color, backgroundColor: active ? color : 'transparent' }]}>
    <Text style={{ color: active ? '#fff' : color, fontWeight: '600', fontSize: 12 }}>{label}</Text>
  </Pressable>
);

export const Empty = ({ text }: { text: string }) => (
  <View style={{ alignItems: 'center', padding: 32 }}>
    <Text style={{ color: C.muted, textAlign: 'center' }}>{text}</Text>
  </View>
);

const s = StyleSheet.create({
  btn: { paddingVertical: 13, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  label: { fontSize: 12, color: C.muted, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', color: C.text },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6, marginBottom: 6 },
});
