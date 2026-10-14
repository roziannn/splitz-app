import '../lib/crashGuard'; // harus paling atas agar kesalahan saat memuat modul lain ikut tertangkap
import { useEffect } from 'react';
import { View } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import { Pressable, ScrollView, Text as RNText } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Onboarding } from '../components/Onboarding';
import { markOnboarded, useOnboarded } from '../lib/onboarding';
import { StoreProvider, useStore } from '../lib/store';
import { ThemeProvider, useThemeMode } from '../lib/themeContext';
import { ToastHost } from '../lib/toast';

function Shell() {
  const { scheme, colors: C } = useThemeMode();
  const onboarded = useOnboarded();
  const { ready, receipts } = useStore();
  // Pengguna lama (sudah punya catatan) tidak perlu panduan pertama kali; panduan tetap ada lewat ikon ? di Laporan.
  useEffect(() => {
    if (onboarded === false && ready && receipts.length > 0) markOnboarded();
  }, [onboarded, ready, receipts.length]);
  // Warna jendela di belakang layar ikut tema, supaya tidak ada kilatan putih saat transisi.
  useEffect(() => {
    try {
      require('expo-system-ui').setBackgroundColorAsync(C.bg).catch(() => {});
    } catch {}
  }, [C.bg]);
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
        <Stack.Screen name="pengaturan/tampilan" options={{ title: 'Tampilan' }} />
        <Stack.Screen name="pengaturan/kategori" options={{ title: 'Kategori' }} />
        <Stack.Screen name="pengaturan/mode" options={{ title: 'Mode' }} />
        <Stack.Screen name="pengaturan/backup" options={{ title: 'Ekspor Data' }} />
        <Stack.Screen name="pengaturan/impor" options={{ title: 'Impor Data' }} />
        <Stack.Screen name="pengaturan/privasi" options={{ title: 'Kebijakan Privasi' }} />
        <Stack.Screen name="pengaturan/pembaruan" options={{ title: 'Pembaruan Aplikasi' }} />
        <Stack.Screen name="pengaturan/tentang" options={{ title: 'Tentang Scan Struk' }} />
        <Stack.Screen name="tutorial" options={{ title: 'Panduan' }} />
        <Stack.Screen name="tutup-buku" options={{ title: 'Tutup Buku' }} />
        <Stack.Screen name="receipt/[id]" options={{ title: 'Detail Struk' }} />
        <Stack.Screen name="receipt/split/[id]" options={{ title: 'Split Bill' }} />
      </Stack>
      {onboarded === false && ready && receipts.length === 0 ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
          <Onboarding onDone={markOnboarded} />
        </View>
      ) : null}
      <ToastHost />
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

/** Layar cadangan jika ada layar yang gagal digambar: tampilkan pesannya, bukan menutup aplikasi. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0e1415' }}>
      <RNText style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Terjadi kesalahan</RNText>
      <RNText style={{ color: '#cbd5d5', marginBottom: 16 }}>{String(error?.message ?? error)}</RNText>
      <Pressable onPress={retry} style={{ backgroundColor: '#0f766e', padding: 14, borderRadius: 12, alignItems: 'center' }}>
        <RNText style={{ color: '#fff', fontWeight: '700' }}>Coba lagi</RNText>
      </Pressable>
    </ScrollView>
  );
}
