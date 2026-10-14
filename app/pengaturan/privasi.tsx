import { ScrollView, View } from 'react-native';
import { Text } from '../../components/Text';
import { Card } from '../../components/ui';
import { PRIVACY_CONTACT, PRIVACY_INTRO, PRIVACY_SECTIONS, PRIVACY_UPDATED } from '../../lib/privacy';
import { useColors } from '../../lib/themeContext';

export default function Privasi() {
  const C = useColors();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>Diperbarui {PRIVACY_UPDATED}</Text>
      <Text style={{ marginBottom: 14, lineHeight: 21 }}>{PRIVACY_INTRO}</Text>
      {PRIVACY_SECTIONS.map((s) => (
        <Card key={s.title}>
          <Text style={{ fontWeight: '700', marginBottom: 6 }}>{s.title}</Text>
          {s.body.map((p, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, marginTop: i ? 4 : 0 }}>
              <Text style={{ color: C.muted }}>•</Text>
              <Text style={{ flex: 1, color: C.muted, lineHeight: 20 }}>{p}</Text>
            </View>
          ))}
        </Card>
      ))}
      {PRIVACY_CONTACT ? (
        <Card>
          <Text style={{ fontWeight: '700', marginBottom: 6 }}>Kontak</Text>
          <Text style={{ color: C.muted }}>{PRIVACY_CONTACT}</Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}
