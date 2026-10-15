import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../components/Text';
import { ProviderLogo } from '../../components/ProviderLogo';
import { Button } from '../../components/ui';
import { balanceOf, readableOn, typeInfo, useAccounts } from '../../lib/accounts';
import { rupiah } from '../../lib/format';
import { useStore } from '../../lib/store';
import { useColors } from '../../lib/themeContext';

/** Daftar rekening dan kartu beserta saldonya. Ketuk satu untuk melihat catatan terakhirnya. */
export default function Kartu() {
  const C = useColors();
  const router = useRouter();
  const accounts = useAccounts();
  const { receipts } = useStore();
  const total = accounts.reduce((s, a) => s + balanceOf(a, receipts), 0);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {accounts.length ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: C.muted, fontSize: 12 }}>Total saldo</Text>
            <Text style={{ fontSize: 30, fontWeight: '800', color: C.accent }}>{rupiah(total)}</Text>
          </View>
        ) : null}

        {accounts.map((a) => {
          const bal = balanceOf(a, receipts);
          const fg = readableOn(a.color);
          const last = receipts.filter((r) => r.accountId === a.id).sort((x, y) => y.date.localeCompare(x.date) || y.createdAt - x.createdAt)[0];
          return (
            <Pressable
              key={a.id}
              onPress={() => router.push(`/rekening/${a.id}` as any)}
              style={({ pressed }) => ({ backgroundColor: a.color, borderRadius: 18, padding: 18, marginBottom: 12, opacity: pressed ? 0.92 : 1 })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ProviderLogo account={a} size={38} />
                <Text style={{ color: fg, fontWeight: '700', flex: 1 }} numberOfLines={1}>{a.name}</Text>
                <Text style={{ color: fg, opacity: 0.8, fontSize: 12 }}>{typeInfo(a.type).label}</Text>
              </View>
              <Text style={{ color: fg, fontSize: 26, fontWeight: '800', marginTop: 14 }}>{rupiah(bal)}</Text>
              <Text style={{ color: fg, opacity: 0.8, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                {last ? `Terakhir: ${last.merchant} · ${rupiah(last.total)}` : 'Belum ada catatan'}
              </Text>
            </Pressable>
          );
        })}

        {!accounts.length ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
            <Ionicons name="card-outline" size={64} color={C.muted} />
            <Text style={{ fontWeight: '700', fontSize: 16, marginTop: 12 }}>Belum ada rekening</Text>
            <Text style={{ color: C.muted, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>Tambahkan rekening bank, e-wallet, atau tunai di Pengaturan untuk melihat saldo dan catatan terakhirnya.</Text>
            <Button title="Tambah di Pengaturan" onPress={() => router.push('/pengaturan/rekening' as any)} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
