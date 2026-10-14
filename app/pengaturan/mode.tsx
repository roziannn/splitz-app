import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../components/Text';
import { Button, Card, Chip, Field } from '../../components/ui';
import { addMember, AppMode, removeMember, setAppMode, useFamily } from '../../lib/family';
import { useColors } from '../../lib/themeContext';
import { toast } from '../../lib/toast';

const APP_MODES: { key: AppMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'pribadi', label: 'Pribadi', icon: 'person-outline' },
  { key: 'keluarga', label: 'Keluarga', icon: 'people-outline' },
];

export default function Mode() {
  const C = useColors();
  const family = useFamily();
  const [memberName, setMemberName] = useState('');

  const add = () => {
    const err = addMember(memberName);
    if (err) return toast.error(err);
    toast.success(`${memberName.trim()} ditambahkan`);
    setMemberName('');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 10 }}>Mode</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {APP_MODES.map((m) => {
            const active = family.mode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => { setAppMode(m.key); toast.info(`Mode ${m.label}`); }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => ({ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: active ? C.primary : C.border, backgroundColor: active ? C.primary : 'transparent', opacity: pressed ? 0.85 : 1 })}>
                <Ionicons name={m.icon} size={24} color={active ? '#fff' : C.muted} />
                <Text style={{ marginTop: 6, fontSize: 12, fontWeight: '700', color: active ? '#fff' : C.muted }}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ color: C.muted, fontSize: 12, marginTop: 10 }}>
          {family.mode === 'keluarga' ? 'Anggota keluarga muncul sebagai pilihan saat split bill, dan total per orang per hari tampil di Laporan.' : 'Pribadi: split bill dengan teman, nama diketik sendiri.'}
        </Text>
      </Card>

      {family.mode === 'keluarga' ? (
        <Card>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Anggota keluarga</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {family.members.map((m) => (
              <Chip key={m.id} label={`${m.name}  ✕`} active onPress={() => { removeMember(m.id); toast.info(`${m.name} dihapus`); }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 6 }}>
            <View style={{ flex: 1 }}>
              <Field value={memberName} onChangeText={setMemberName} placeholder="Nama anggota" onSubmitEditing={add} returnKeyType="done" />
            </View>
            <Button title="Tambah" onPress={add} />
          </View>
        </Card>
      ) : null}
    </ScrollView>
  );
}
