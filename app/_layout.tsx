import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../lib/store';
import { C } from '../lib/theme';

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: C.primary }, headerTintColor: '#fff', contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="tambah/scan" options={{ title: 'Scan Struk' }} />
        <Stack.Screen name="tambah/bensin" options={{ title: 'Catat Bensin' }} />
        <Stack.Screen name="receipt/[id]" options={{ title: 'Detail Struk' }} />
        <Stack.Screen name="receipt/split/[id]" options={{ title: 'Split Bill' }} />
      </Stack>
    </StoreProvider>
  );
}
