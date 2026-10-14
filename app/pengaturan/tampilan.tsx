import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../components/Text';
import { Card } from '../../components/ui';
import { ThemeMode, useColors, useThemeMode } from '../../lib/themeContext';

const MODES: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', label: 'Ikuti sistem', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Terang', icon: 'sunny-outline' },
  { key: 'dark', label: 'Gelap', icon: 'moon-outline' },
];

export default function Tampilan() {
  const C = useColors();
  const { mode, setMode } = useThemeMode();
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 10 }}>Tema</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => ({ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: active ? C.accent : C.border, backgroundColor: active ? C.primarySoft : 'transparent', opacity: pressed ? 0.85 : 1 })}>
                <Ionicons name={m.icon} size={24} color={active ? C.accent : C.muted} />
                <Text style={{ marginTop: 6, fontSize: 12, fontWeight: active ? '700' : '500', color: active ? C.accent : C.muted }}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
    </ScrollView>
  );
}
