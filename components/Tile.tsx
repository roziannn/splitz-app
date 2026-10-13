import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { Text } from './Text';
import { useColors } from '../lib/themeContext';

/** Kotak pilihan besar dengan ikon, judul, dan keterangan singkat. */
export function Tile({ icon, title, desc, onPress, color }: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string; onPress: () => void; color?: string }) {
  const C = useColors();
  const tint = color ?? C.accent;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: '48%',
        backgroundColor: C.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
        marginBottom: 12,
        opacity: pressed ? 0.85 : 1,
      })}>
      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: tint + '1f', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Ionicons name={icon} size={26} color={tint} />
      </View>
      <Text style={{ fontSize: 16, fontWeight: '800', color: C.text }}>{title}</Text>
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{desc}</Text>
    </Pressable>
  );
}
