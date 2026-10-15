import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { ProviderLogo } from '../../components/ProviderLogo';
import { Text } from '../../components/Text';
import { BottomBar, Button } from '../../components/ui';
import { typeInfo, useAccounts } from '../../lib/accounts';
import { useColors } from '../../lib/themeContext';

/** Kelola rekening: tambah, ubah, atau hapus. Saldo dan catatannya dilihat di tab Kartu. */
export default function Rekening() {
  const C = useColors();
  const router = useRouter();
  const accounts = useAccounts();

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {accounts.length ? (
          <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
            {accounts.map((a, i) => (
              <Pressable
                key={a.id}
                onPress={() => router.push(`/rekening/form?id=${a.id}` as any)}
                android_ripple={{ color: C.border }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: i ? 1 : 0, borderTopColor: C.border }}>
                <ProviderLogo account={a} size={40} onLight />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600' }} numberOfLines={1}>{a.name}</Text>
                  <Text style={{ color: C.muted, fontSize: 12 }}>{typeInfo(a.type).label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.muted} />
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
            <Ionicons name="card-outline" size={64} color={C.muted} />
            <Text style={{ fontWeight: '700', fontSize: 16, marginTop: 12 }}>Belum ada rekening</Text>
            <Text style={{ color: C.muted, textAlign: 'center', marginTop: 4 }}>Tambahkan bank, e-wallet, atau tunai. Saldonya tampil di tab Kartu.</Text>
          </View>
        )}
      </ScrollView>
      <BottomBar>
        <Button title="Tambah rekening" onPress={() => router.push('/rekening/form' as any)} style={{ flex: 1 }} />
      </BottomBar>
    </View>
  );
}
