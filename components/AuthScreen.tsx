import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from './ui';
import { Text } from './Text';
import { useAuth } from '../lib/auth';
import { useColors } from '../lib/themeContext';

export function AuthScreen() {
  const C = useColors();
  const { login, error, clearError } = useAuth();
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try { await login(email, password, register); } catch {} finally { setBusy(false); }
  };
  const field = { borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: C.text, marginTop: 12 } as const;
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 32, fontWeight: '900', color: C.primary }}>Splitz</Text>
          <Text style={{ color: C.muted, marginTop: 6, textAlign: 'center' }}>Masuk untuk menyinkronkan catatan antar perangkat.</Text>
        </View>
        <Card style={{ padding: 18 }}>
          <Text style={{ fontSize: 20, fontWeight: '800' }}>{register ? 'Buat akun' : 'Masuk'}</Text>
          <TextInput value={email} onChangeText={(v) => { setEmail(v); clearError(); }} placeholder="Email" placeholderTextColor={C.muted} autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={field} />
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, borderRadius: 12 }}>
            <TextInput value={password} onChangeText={(v) => { setPassword(v); clearError(); }} placeholder="Kata sandi (minimal 8 karakter)" placeholderTextColor={C.muted} secureTextEntry={!showPassword} autoComplete={register ? 'new-password' : 'password'} style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12, color: C.text }} />
            <Pressable onPress={() => setShowPassword((v) => !v)} accessibilityRole="button" accessibilityLabel={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} hitSlop={10} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color={C.muted} />
            </Pressable>
          </View>
          {error ? <Text style={{ color: C.danger, marginTop: 10 }}>{error}</Text> : null}
          <View style={{ marginTop: 18 }}><Button title={register ? 'Daftar' : 'Masuk'} onPress={submit} loading={busy} disabled={busy || !email || !password} /></View>
          <Text onPress={() => { setRegister((v) => !v); clearError(); }} style={{ color: C.accent, textAlign: 'center', marginTop: 18, fontWeight: '700' }}>
            {register ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
