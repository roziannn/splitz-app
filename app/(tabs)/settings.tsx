import { useState } from 'react';
import { Alert, Linking, ScrollView, Text } from 'react-native';
import { Button, Card } from '../../components/ui';
import { C } from '../../lib/theme';
import { checkForUpdate, currentVersion } from '../../lib/update';

export default function Settings() {
  const [checking, setChecking] = useState(false);

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
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Pembaruan aplikasi</Text>
        <Text style={{ color: C.muted, marginBottom: 10 }}>Versi saat ini: {currentVersion()}</Text>
        <Button title="Cek pembaruan" onPress={update} loading={checking} />
      </Card>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Tentang scan struk</Text>
        <Text style={{ color: C.muted }}>
          Struk dibaca langsung di HP (Google ML Kit) tanpa internet dan tanpa API key. Hasilnya bisa dikoreksi di halaman detail struk.
        </Text>
      </Card>
    </ScrollView>
  );
}
