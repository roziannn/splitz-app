import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { Button, Card, Field } from '../../components/ui';
import { getApiKey, setApiKey } from '../../lib/storage';
import { C } from '../../lib/theme';

export default function Settings() {
  const [key, setKey] = useState('');
  useEffect(() => { getApiKey().then((k) => setKey(k || '')); }, []);
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
    </ScrollView>
  );
}
