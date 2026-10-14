import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { ColorValue, Pressable } from "react-native";
import { useColors } from '../../lib/themeContext';

const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: ColorValue; size: number }) => (
  <Ionicons name={name} color={color} size={size} />
);

export default function TabsLayout() {
  const C = useColors();
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: C.primary },
        headerTintColor: '#fff',
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.card, borderTopColor: C.border },
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
              <Ionicons name="help-circle-outline" size={26} color="#fff" />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="catat" options={{ title: 'Catat', tabBarIcon: icon('add-circle') }} />
      <Tabs.Screen name="history" options={{ title: 'Riwayat', tabBarIcon: icon('receipt') }} />
      <Tabs.Screen name="settings" options={{ title: 'Pengaturan', tabBarIcon: icon('settings') }} />
    </Tabs>
  );
}
