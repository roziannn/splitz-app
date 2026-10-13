import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue } from "react-native";
import { useColors } from '../../lib/themeContext';

const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: ColorValue; size: number }) => (
  <Ionicons name={name} color={color} size={size} />
);

export default function TabsLayout() {
  const C = useColors();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: C.primary },
        headerTintColor: '#fff',
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.card, borderTopColor: C.border },
        sceneStyle: { backgroundColor: C.bg },
        animation: 'fade',
      }}>
      <Tabs.Screen name="index" options={{ title: 'Laporan', tabBarIcon: icon('stats-chart') }} />
      <Tabs.Screen name="catat" options={{ title: 'Catat', tabBarIcon: icon('add-circle') }} />
      <Tabs.Screen name="history" options={{ title: 'Riwayat', tabBarIcon: icon('receipt') }} />
      <Tabs.Screen name="settings" options={{ title: 'Pengaturan', tabBarIcon: icon('settings') }} />
    </Tabs>
  );
}
