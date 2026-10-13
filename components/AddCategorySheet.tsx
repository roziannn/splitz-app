import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { addCategory, MAX_NAME } from '../lib/customCategories';
import { COLOR_CHOICES, ICON_CHOICES, IconName } from '../lib/iconChoices';
import { C } from '../lib/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdded: (name: string) => void;
}

/** Lembar bawah untuk membuat kategori: nama, ikon pilihan sendiri, dan warna. */
export function AddCategorySheet({ visible, onClose, onAdded }: Props) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<IconName>(ICON_CHOICES[0]);
  const [color, setColor] = useState(COLOR_CHOICES[0]);
  const [error, setError] = useState('');

  const close = () => {
    setName('');
    setError('');
    onClose();
  };
  const save = () => {
    const err = addCategory({ name, icon, color });
    if (err) return setError(err);
    onAdded(name.trim());
    close();
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={close}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' }} onPress={close}>
        <Pressable onPress={() => {}} style={{ backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '88%' }}>
          <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
            <Text style={{ fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 14 }}>Kategori baru</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={icon} size={28} color="#fff" />
              </View>
              <TextInput
                value={name}
                onChangeText={(t) => { setName(t); setError(''); }}
                placeholder="Nama kategori"
                placeholderTextColor={C.muted}
                maxLength={MAX_NAME}
                style={{ flex: 1, borderWidth: 1, borderColor: error ? C.danger : C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.text }}
              />
            </View>
            {error ? <Text style={{ color: C.danger, marginTop: 6 }}>{error}</Text> : null}

            <Text style={{ fontWeight: '700', color: C.text, marginTop: 18, marginBottom: 8 }}>Pilih ikon</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {ICON_CHOICES.map((i) => {
                const active = i === icon;
                return (
                  <Pressable key={i} onPress={() => setIcon(i)} style={{ width: '20%', alignItems: 'center', paddingVertical: 6 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? color : '#ececef' }}>
                      <Ionicons name={i} size={24} color={active ? '#fff' : '#3f3f46'} />
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Text style={{ fontWeight: '700', color: C.text, marginTop: 14, marginBottom: 8 }}>Warna</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {COLOR_CHOICES.map((c) => (
                <Pressable key={c} onPress={() => setColor(c)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, alignItems: 'center', justifyContent: 'center', borderWidth: c === color ? 3 : 0, borderColor: C.text }}>
                  {c === color ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: C.border }}>
            <Pressable onPress={close} style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontWeight: '700', color: C.muted }}>Batal</Text>
            </Pressable>
            <Pressable onPress={save} disabled={!name.trim()} style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', opacity: name.trim() ? 1 : 0.4 }}>
              <Text style={{ fontWeight: '700', color: '#fff' }}>Simpan</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
