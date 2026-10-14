import { ScrollView } from 'react-native';
import { Text } from '../../components/Text';
import { Card } from '../../components/ui';
import { useColors } from '../../lib/themeContext';

export default function Tentang() {
  const C = useColors();
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Tentang scan struk</Text>
        <Text style={{ color: C.muted }}>
          Struk dibaca langsung di HP (Google ML Kit) tanpa internet dan tanpa API key. Hasilnya bisa dikoreksi di halaman detail struk.
        </Text>
      </Card>
    </ScrollView>
  );
}
