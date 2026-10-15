import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './Text';
import { readableOn, useAccounts } from '../lib/accounts';
import { ProviderLogo } from './ProviderLogo';
import { useColors } from '../lib/themeContext';

/** Pilih rekening asal pembayaran; ketuk lagi untuk melepas. Tidak tampil bila belum ada rekening. */
export function AccountPicker({ value, onChange }: { value?: string; onChange: (id: string | undefined) => void }) {
  const C = useColors();
  const accounts = useAccounts();
  if (!accounts.length) return null;
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={{ color: C.muted, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>Dibayar dari</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {accounts.map((a) => {
          const active = value === a.id;
          return (
            <Pressable
              key={a.id}
              onPress={() => onChange(active ? undefined : a.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6, borderWidth: 1, borderColor: active ? a.color : C.border, backgroundColor: active ? a.color : 'transparent' }}>
              <ProviderLogo account={a} size={20} onLight={!active} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: active ? readableOn(a.color) : C.text }}>{a.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
