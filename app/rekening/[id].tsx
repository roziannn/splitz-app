import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Text } from '../../components/Text';
import { BottomBar, Button } from '../../components/ui';
import { ProviderLogo } from '../../components/ProviderLogo';
import { balanceOf, readableOn, spentFrom, typeInfo, useAccounts } from '../../lib/accounts';
import { prettyDate, rupiah } from '../../lib/format';
import { editHref } from '../../lib/routes';
import { useStore } from '../../lib/store';
import { useColors } from '../../lib/themeContext';

export default function DetailRekening() {
  const C = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const account = useAccounts().find((a) => a.id === id);
  const { receipts } = useStore();
  const list = useMemo(
    () => receipts.filter((r) => r.accountId === id).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [receipts, id],
  );
  if (!account) return <Text style={{ padding: 16 }}>Rekening tidak ditemukan.</Text>;
  const fg = readableOn(account.color);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: account.name }} />
      <FlatList
        data={list}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View style={{ backgroundColor: account.color, borderRadius: 18, padding: 18, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ProviderLogo account={account} size={38} />
              <Text style={{ color: fg, opacity: 0.85 }}>{typeInfo(account.type).label}</Text>
            </View>
            <Text style={{ color: fg, opacity: 0.85, fontSize: 12, marginTop: 14 }}>Saldo</Text>
            <Text style={{ color: fg, fontSize: 30, fontWeight: '800' }}>{rupiah(balanceOf(account, receipts))}</Text>
            <Text style={{ color: fg, opacity: 0.85, fontSize: 12, marginTop: 6 }}>
              Saldo awal {rupiah(account.initial)} · terpakai {rupiah(spentFrom(account.id, receipts))}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={{ color: C.muted, textAlign: 'center', paddingVertical: 32 }}>Belum ada catatan dari rekening ini. Pilih "Dibayar dari" saat mencatat pengeluaran.</Text>
        }
        renderItem={({ item: r }) => (
          <Pressable
            onPress={() => router.push(editHref(r) as any)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700' }} numberOfLines={1}>{r.merchant}</Text>
              <Text style={{ color: C.muted, fontSize: 12 }}>{prettyDate(r.date)}</Text>
            </View>
            <Text style={{ fontWeight: '800', color: C.text }}>-{rupiah(r.total)}</Text>
          </Pressable>
        )}
      />
      <BottomBar>
        <Button title="Ubah rekening" kind="ghost" onPress={() => router.push(`/rekening/form?id=${account.id}` as any)} style={{ flex: 1 }} />
      </BottomBar>
    </View>
  );
}
