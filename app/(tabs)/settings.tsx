import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../components/Text';
import { useFamily } from '../../lib/family';
import { useStore } from '../../lib/store';
import { useColors, useThemeMode } from '../../lib/themeContext';
import { currentVersion } from '../../lib/update';

type Icon = keyof typeof Ionicons.glyphMap;
interface Item {
  icon: Icon;
  label: string;
  value?: string;
  href: string;
}

const THEME_LABEL = { system: 'Ikuti sistem', light: 'Terang', dark: 'Gelap' } as const;

/** Daftar pengaturan: ketuk satu baris untuk masuk ke halamannya. */
export default function Settings() {
  const C = useColors();
  const router = useRouter();
  const { mode } = useThemeMode();
  const family = useFamily();
  const { receipts } = useStore();

  const groups: Item[][] = [
    [
      { icon: 'color-palette-outline', label: 'Tampilan', value: THEME_LABEL[mode], href: '/pengaturan/tampilan' },
      { icon: 'people-outline', label: 'Mode', value: family.mode === 'keluarga' ? `Keluarga · ${family.members.length}` : 'Pribadi', href: '/pengaturan/mode' },
    ],
    [
      { icon: 'lock-closed-outline', label: 'Tutup buku', href: '/tutup-buku' },
      { icon: 'download-outline', label: 'Backup data', value: `${receipts.length} catatan`, href: '/pengaturan/backup' },
    ],
    [
      { icon: 'cloud-download-outline', label: 'Pembaruan aplikasi', value: `v${currentVersion()}`, href: '/pengaturan/pembaruan' },
      { icon: 'information-circle-outline', label: 'Tentang scan struk', href: '/pengaturan/tentang' },
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
                <Ionicons name={it.icon} size={19} color={C.accent} />
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
