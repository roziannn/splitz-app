import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { AddCategorySheet } from '../../components/AddCategorySheet';
import { Text } from '../../components/Text';
import { BottomBar, Button } from '../../components/ui';
import { isCustom, removeCategory, useAllCategories } from '../../lib/customCategories';
import { useColors } from '../../lib/themeContext';
import { toast } from '../../lib/toast';

export default function Kategori() {
  const C = useColors();
  const categories = useAllCategories();
  const [adding, setAdding] = useState(false);

  const remove = (name: string) =>
    Alert.alert(`Hapus kategori "${name}"?`, 'Catatan yang sudah ada tetap memakai nama ini.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => { removeCategory(name); toast.info('Kategori dihapus'); } },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
          {categories.map((c, i) => (
            <View key={c.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: i ? 1 : 0, borderTopColor: C.border }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.color, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={c.icon} size={20} color="#fff" />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '600' }}>{c.name}</Text>
              {isCustom(c.name) ? (
                <Pressable onPress={() => remove(c.name)} hitSlop={10} accessibilityLabel={`Hapus kategori ${c.name}`}>
                  <Ionicons name="trash-outline" size={20} color={C.danger} />
                </Pressable>
              ) : (
                <Text style={{ color: C.muted, fontSize: 12 }}>Bawaan</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomBar>
        <Button title="Tambah kategori" onPress={() => setAdding(true)} style={{ flex: 1 }} />
      </BottomBar>
      <AddCategorySheet visible={adding} onClose={() => setAdding(false)} onAdded={() => {}} />
    </View>
  );
}
