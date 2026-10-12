import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Text } from 'react-native';
import { Button, Card, Field } from '../../components/ui';
import { getApiKey, setApiKey } from '../../lib/storage';
import { C } from '../../lib/theme';
import { checkForUpdate, currentVersion } from '../../lib/update';

export default function Settings() {
  const [key, setKey] = useState('');
  const [checking, setChecking] = useState(false);
  useEffect(() => { getApiKey().then((k) => setKey(k || '')); }, []);

  const update = async () => {
    setChecking(true);
    try {
      const info = await checkForUpdate();
      if (!info.available || !info.apkUrl) return Alert.alert('Sudah terbaru', `Anda memakai versi ${currentVersion()}.`);
      Alert.alert(`Versi ${info.latest} tersedia`, info.notes || 'Unduh dan pasang pembaruan sekarang?', [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Unduh', onPress: () => Linking.openURL(info.apkUrl!) },
      ]);
    } catch (e: any) {
      Alert.alert('Gagal', e.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Anthropic API Key</Text>
        <Text style={{ color: C.muted, marginBottom: 10 }}>
          Dipakai untuk membaca struk (OCR AI). Disimpan terenkripsi di perangkat (SecureStore) dan hanya dikirim ke api.anthropic.com.
        </Text>
        <Field value={key} onChangeText={setKey} placeholder="sk-ant-..." secureTextEntry autoCapitalize="none" autoCorrect={false} />
        <Button title="Simpan" onPress={async () => { await setApiKey(key.trim()); Alert.alert('Tersimpan'); }} />
      </Card>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Pembaruan aplikasi</Text>
        <Text style={{ color: C.muted, marginBottom: 10 }}>Versi saat ini: {currentVersion()}</Text>
        <Button title="Cek pembaruan" onPress={update} loading={checking} />
      </Card>
    </ScrollView>
  );
}
