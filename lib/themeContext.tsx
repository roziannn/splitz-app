import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { DARK, LIGHT, Palette } from './theme';

export type ThemeMode = 'system' | 'light' | 'dark';

const KEY = 'splitz.theme.v1';

interface Ctx {
  mode: ThemeMode; // pilihan pengguna
  scheme: 'light' | 'dark'; // yang sedang dipakai
  colors: Palette;
  setMode: (m: ThemeMode) => void;
}

const ThemeCtx = createContext<Ctx>({ mode: 'system', scheme: 'light', colors: LIGHT, setMode: () => {} });

/** Warna aktif (terang/gelap). Pakai di setiap komponen: `const C = useColors();` */
export const useColors = () => useContext(ThemeCtx).colors;
export const useThemeMode = () => useContext(ThemeCtx);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setModeState(v);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m).catch(() => {});
  }, []);

  const scheme: 'light' | 'dark' = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  const value = useMemo<Ctx>(() => ({ mode, scheme, colors: scheme === 'dark' ? DARK : LIGHT, setMode }), [mode, scheme, setMode]);

  // Tunggu pilihan tersimpan terbaca agar tidak berkedip terang lalu gelap saat aplikasi dibuka.
  if (!loaded) return <View style={{ flex: 1, backgroundColor: system === 'dark' ? DARK.bg : LIGHT.bg }} />;
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

/** Gaya yang bergantung pada warna aktif. `factory` harus didefinisikan di luar komponen agar stabil. */
export function useStyles<T>(factory: (C: Palette) => T): T {
  const C = useColors();
  return useMemo(() => factory(C), [C, factory]);
}
