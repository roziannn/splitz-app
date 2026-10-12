import { useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Empty } from '../../components/ui';
import { prettyDate, rupiah } from '../../lib/format';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';

export default function History() {
  const { receipts } = useStore();
  const router = useRouter();
  const sorted = [...receipts].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  return (
    <FlatList
      data={sorted}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      ListEmptyComponent={<Empty text="Belum ada struk." />}
      renderItem={({ item: r }) => (
        <Pressable
          onPress={() => router.push(`/receipt/${r.id}`)}
          style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: C.text }}>{r.merchant}</Text>
            <Text style={{ color: C.muted, fontSize: 12 }}>{prettyDate(r.date)} · {r.items.length} item{r.people.length ? ` · ${r.people.length} orang` : ''}</Text>
          </View>
          <Text style={{ fontWeight: '800', color: C.primary }}>{rupiah(r.total)}</Text>
        </Pressable>
      )}
    />
  );
}
