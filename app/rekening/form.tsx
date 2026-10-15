import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { MoneyField } from '../../components/MoneyField';
import { Text } from '../../components/Text';
import { BottomBar, Button, Card, Field } from '../../components/ui';
import { ProviderLogo } from '../../components/ProviderLogo';
import { ACCOUNT_TYPES, AccountType, PROVIDERS, providerInfo, removeAccount, saveAccount, useAccounts } from '../../lib/accounts';
import { COLOR_CHOICES } from '../../lib/iconChoices';
import { useColors } from '../../lib/themeContext';
import { toast } from '../../lib/toast';

export default function FormRekening() {
  const C = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useAccounts().find((a) => a.id === id);

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<AccountType>(existing?.type ?? 'bank');
  const [color, setColor] = useState(existing?.color ?? COLOR_CHOICES[0]);
  const [initial, setInitial] = useState(existing?.initial ?? 0);
  const [provider, setProvider] = useState<string | undefined>(existing?.provider);

  // Memilih bank/e-wallet mengisi nama dan warna bawaannya (nama hanya diganti bila belum diubah sendiri).
  const pickProvider = (key: string | undefined) => {
    const prev = providerInfo(provider);
    const next = providerInfo(key);
    setProvider(key);
    if (next) {
      setColor(next.bg);
      if (!name.trim() || name === prev?.label) setName(next.label);
    } else if (prev && name === prev.label) setName('');
  };
  const pickType = (t: AccountType) => {
    setType(t);
    if (providerInfo(provider)?.type !== t) pickProvider(undefined);
  };

  const save = () => {
    const err = saveAccount({ id: existing?.id, name, type, color, provider, initial });
    if (err) return toast.error(err);
    toast.success(existing ? 'Rekening diperbarui' : 'Rekening ditambahkan');
    router.back();
  };
  const del = () =>
    Alert.alert(`Hapus "${existing?.name}"?`, 'Catatan yang pernah dibayar dari rekening ini tetap ada, hanya tidak terhubung lagi.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => { removeAccount(existing!.id); toast.info('Rekening dihapus'); router.dismissAll(); } },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: existing ? 'Ubah Rekening' : 'Rekening Baru' }} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Card>
          <Field label="Nama" value={name} onChangeText={setName} placeholder="mis. BCA, GoPay, Dompet" maxLength={24} />
          <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600', marginBottom: 6 }}>Jenis</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {ACCOUNT_TYPES.map((t) => {
              const active = type === t.key;
              return (
                <Pressable key={t.key} onPress={() => pickType(t.key)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: active ? C.primary : C.border, backgroundColor: active ? C.primary : 'transparent' }}>
                  <Ionicons name={t.icon} size={15} color={active ? '#fff' : C.muted} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : C.text }}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {type !== 'tunai' ? (
            <>
              <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600', marginBottom: 6 }}>{type === 'bank' ? 'Pilih bank' : 'Pilih e-wallet'}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                {PROVIDERS.filter((p) => p.type === type).map((p) => {
                  const active = provider === p.key;
                  return (
                    <Pressable key={p.key} onPress={() => pickProvider(active ? undefined : p.key)} style={{ width: '30%', alignItems: 'center', paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: active ? C.primary : C.border, backgroundColor: active ? C.primarySoft : 'transparent' }}>
                      <ProviderLogo account={{ type, provider: p.key, color: p.bg }} size={48} />
                      <Text style={{ marginTop: 6, fontSize: 12, fontWeight: active ? '700' : '500' }}>{p.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>Tidak ada di daftar? Biarkan tanpa pilihan dan isi namanya sendiri.</Text>
            </>
          ) : null}
          <MoneyField label="Saldo awal" value={initial} onChange={setInitial} />
          <Text style={{ color: C.muted, fontSize: 12 }}>Saldo sekarang dihitung dari saldo awal dikurangi pengeluaran yang dicatat dari rekening ini.</Text>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700', marginBottom: 10 }}>Warna</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {COLOR_CHOICES.map((c) => (
              <Pressable key={c} onPress={() => setColor(c)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, alignItems: 'center', justifyContent: 'center', borderWidth: c === color ? 3 : 0, borderColor: C.text }}>
                {c === color ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
              </Pressable>
            ))}
          </View>
        </Card>

        {existing ? (
          <Pressable onPress={del} hitSlop={8} style={{ alignSelf: 'center', padding: 12 }}>
            <Text style={{ color: C.danger, fontWeight: '600' }}>Hapus rekening</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <BottomBar>
        <Button title={existing ? 'Simpan perubahan' : 'Simpan'} onPress={save} style={{ flex: 1 }} />
      </BottomBar>
    </View>
  );
}
