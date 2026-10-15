import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../components/Text';
import { useAccounts } from '../../lib/accounts';
import { useAllCategories } from '../../lib/customCategories';
import { useFamily } from '../../lib/family';
import { useColors, useThemeMode } from '../../lib/themeContext';
import { currentVersion } from '../../lib/update';

type Icon = keyof typeof Ionicons.glyphMap;
interface Item {
  icon: Icon;
  label: string;
  value?: string;
  href: string;
  excel?: boolean; // ikon Excel hijau
}

const THEME_LABEL = { system: 'Ikuti sistem', light: 'Terang', dark: 'Gelap' } as const;

/** Daftar pengaturan: ketuk satu baris untuk masuk ke halamannya. */
export default function Settings() {
  const C = useColors();
  const router = useRouter();
  const { mode } = useThemeMode();
  const family = useFamily();
  const categories = useAllCategories();
  const accounts = useAccounts();

  const groups: Item[][] = [
    [
      { icon: 'color-palette-outline', label: 'Tampilan', value: THEME_LABEL[mode], href: '/pengaturan/tampilan' },
      { icon: 'card-outline', label: 'Rekening', value: `${accounts.length}`, href: '/pengaturan/rekening' },
      { icon: 'shapes-outline', label: 'Kategori', value: `${categories.length}`, href: '/pengaturan/kategori' },
      { icon: 'people-outline', label: 'Mode', value: family.mode === 'keluarga' ? `Keluarga · ${family.members.length}` : 'Pribadi', href: '/pengaturan/mode' },
    ],
    [
      { icon: 'lock-closed-outline', label: 'Tutup buku', href: '/tutup-buku' },
      { icon: 'download-outline', label: 'Ekspor data', value: 'Excel · PDF', href: '/pengaturan/backup', excel: true },
      { icon: 'cloud-upload-outline', label: 'Impor data', value: 'Excel', href: '/pengaturan/impor', excel: true },
    ],
    [
      { icon: 'cloud-download-outline', label: 'Pembaruan aplikasi', value: `v${currentVersion()}`, href: '/pengaturan/pembaruan' },
      { icon: 'information-circle-outline', label: 'Tentang scan struk', href: '/pengaturan/tentang' },
      { icon: 'shield-checkmark-outline', label: 'Kebijakan privasi', href: '/pengaturan/privasi' },
    ],
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {groups.map((items, g) => (
        <View key={g} style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12, overflow: 'hidden' }}>
          {items.map((it, i) => (
            <Pressable
              key={it.label}
              onPress={() => router.push(it.href as any)}
              android_ripple={{ color: C.border }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, gap: 14, borderTopWidth: i ? 1 : 0, borderTopColor: C.border }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                {it.excel ? <MaterialCommunityIcons name="file-excel" size={21} color="#217346" /> : <Ionicons name={it.icon} size={19} color={C.accent} />}
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '600' }}>{it.label}</Text>
              {it.value ? <Text style={{ color: C.muted, fontSize: 13 }}>{it.value}</Text> : null}
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
