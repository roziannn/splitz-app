import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../components/Text';
import { balanceOf, typeInfo, useAccounts } from '../../lib/accounts';
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
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
        {accounts.length ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: C.muted, fontSize: 12 }}>Total saldo</Text>
            <Text style={{ fontSize: 30, fontWeight: '800', color: C.accent }}>{rupiah(total)}</Text>
          </View>
        ) : null}

        {accounts.map((a) => {
          const bal = balanceOf(a, receipts);
          const last = receipts.filter((r) => r.accountId === a.id).sort((x, y) => y.date.localeCompare(x.date) || y.createdAt - x.createdAt)[0];
          return (
            <Pressable
              key={a.id}
              onPress={() => router.push(`/rekening/${a.id}` as any)}
              style={({ pressed }) => ({ backgroundColor: a.color, borderRadius: 18, padding: 18, marginBottom: 12, opacity: pressed ? 0.92 : 1 })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={typeInfo(a.type).icon} size={20} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', flex: 1 }} numberOfLines={1}>{a.name}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{typeInfo(a.type).label}</Text>
              </View>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 14 }}>{rupiah(bal)}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                {last ? `Terakhir: ${last.merchant} · ${rupiah(last.total)}` : 'Belum ada catatan'}
              </Text>
            </Pressable>
          );
        })}

        {!accounts.length ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
            <Ionicons name="card-outline" size={64} color={C.muted} />
            <Text style={{ fontWeight: '700', fontSize: 16, marginTop: 12 }}>Belum ada rekening</Text>
            <Text style={{ color: C.muted, textAlign: 'center', marginTop: 4 }}>Tambahkan rekening bank, e-wallet, tunai, atau kartu kredit untuk melihat saldo dan catatan terakhirnya.</Text>
          </View>
        ) : null}
      </ScrollView>

      <Pressable
        onPress={() => router.push('/rekening/form' as any)}
        accessibilityLabel="Tambah rekening"
        style={({ pressed }) => ({ position: 'absolute', right: 16, bottom: 16, width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, opacity: pressed ? 0.85 : 1 })}>
        <Ionicons name="add" size={32} color="#fff" />
      </Pressable>
    </View>
  );
}
