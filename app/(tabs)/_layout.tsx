import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { ColorValue, Pressable, View } from "react-native";
import { useColors } from '../../lib/themeContext';

const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: ColorValue; size: number }) => (
  <Ionicons name={name} color={color} size={size} />
);

/** Tombol Catat di tengah: bulat, menonjol di atas bilah tab. */
function CatatButton({ onPress, accessibilityState }: any) {
  const C = useColors();
  const selected = !!accessibilityState?.selected;
  return (
    <View style={{ flex: 1, alignItems: 'center' }} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Catat"
        style={({ pressed }) => ({ marginTop: -18, width: 58, height: 58, borderRadius: 29, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', elevation: 7, shadowColor: C.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: C.dark ? 0.1 : 0.24, shadowRadius: 12, borderWidth: 4, borderColor: C.bg, opacity: pressed ? 0.9 : 1 })}>
        <Ionicons name={selected ? 'close' : 'add'} size={32} color="#fff" />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const C = useColors();
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: C.card },
        headerTintColor: C.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.card, borderTopColor: C.border, shadowColor: C.primary, shadowOffset: { width: 0, height: -4 }, shadowOpacity: C.dark ? 0 : 0.07, shadowRadius: 14, elevation: 10 },
        sceneStyle: { backgroundColor: C.bg },
        animation: 'none', // header tiap tab ikut berpindah; transisi fade membuatnya berkedip putih
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Laporan',
          tabBarIcon: icon('stats-chart'),
          headerRight: () => (
            <Pressable onPress={() => router.push('/tutorial')} hitSlop={10} accessibilityLabel="Panduan" style={{ paddingHorizontal: 16 }}>
              <Ionicons name="help-circle-outline" size={26} color={C.accent} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="history" options={{ title: 'Riwayat', tabBarIcon: icon('receipt') }} />
      <Tabs.Screen name="catat" options={{ title: 'Catat', tabBarLabel: () => null, tabBarButton: (p) => <CatatButton {...p} /> }} />
      <Tabs.Screen name="kartu" options={{ title: 'Kartu', tabBarIcon: icon('card') }} />
      <Tabs.Screen name="settings" options={{ title: 'Pengaturan', tabBarIcon: icon('settings') }} />
    </Tabs>
  );
}
