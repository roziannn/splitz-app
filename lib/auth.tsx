import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export interface AuthUser { id: string; email: string }
interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  error: string | null;
  login: (email: string, password: string, register?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}
const TOKEN_KEY = 'splitz.auth.token.v1';
const USER_KEY = 'splitz.auth.user.v1';
const AuthContext = createContext<AuthContextValue>(null as any);
export const useAuth = () => useContext(AuthContext);

async function authRequest(email: string, password: string, register: boolean) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) throw new Error('Alamat API belum diatur. Tambahkan EXPO_PUBLIC_API_URL pada konfigurasi build.');
  const response = await fetch(`${base}/api/auth/${register ? 'register' : 'login'}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Tidak dapat terhubung ke server');
  return result as { token: string; user: AuthUser };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([SecureStore.getItemAsync(TOKEN_KEY), SecureStore.getItemAsync(USER_KEY)])
      .then(([t, u]) => { if (t && u) { setToken(t); setUser(JSON.parse(u)); } })
      .catch(() => {}).finally(() => setReady(true));
  }, []);
  const login = useCallback(async (email: string, password: string, register = false) => {
    setError(null);
    try {
      const result = await authRequest(email.trim(), password, register);
      await SecureStore.setItemAsync(TOKEN_KEY, result.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(result.user));
      setToken(result.token); setUser(result.user);
    } catch (e: any) { setError(e?.message || 'Terjadi kesalahan'); throw e; }
  }, []);
  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY); await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null); setUser(null); setError(null);
  }, []);
  const value = useMemo(() => ({ user, token, ready, error, login, logout, clearError: () => setError(null) }), [user, token, ready, error, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
