import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../lib/store';
import { ThemeProvider, useThemeMode } from '../lib/themeContext';

function Shell() {
  const { scheme, colors: C } = useThemeMode();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  // Header, latar, dan modal bawaan navigasi ikut mode terang/gelap.
  const navTheme = { ...base, colors: { ...base.colors, background: C.bg, card: C.card, text: C.text, border: C.border, primary: C.accent } };
  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.primary },
          headerTintColor: '#fff',
          contentStyle: { backgroundColor: C.bg },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="tambah/scan" options={{ title: 'Scan Struk' }} />
        <Stack.Screen name="tambah/manual" options={{ title: 'Input Manual' }} />
        <Stack.Screen name="tambah/bensin" options={{ title: 'Catat Bensin' }} />
        <Stack.Screen name="receipt/[id]" options={{ title: 'Detail Struk' }} />
        <Stack.Screen name="receipt/split/[id]" options={{ title: 'Split Bill' }} />
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </ThemeProvider>
  );
}
