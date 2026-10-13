import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../components/Text';
import { Button, Card, Chip, Field } from '../../components/ui';
import { addMember, AppMode, removeMember, setAppMode, useFamily } from '../../lib/family';
import { localIso } from '../../lib/dates';
import { saveBackupToFolder, shareBackup } from '../../lib/backupIO';
import { useStore } from '../../lib/store';
import { ThemeMode, useColors, useThemeMode } from '../../lib/themeContext';
import { applyOtaUpdate, checkForUpdate, currentVersion, downloadAndInstallApk } from '../../lib/update';

const MODES: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', label: 'Ikuti sistem', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Terang', icon: 'sunny-outline' },
  { key: 'dark', label: 'Gelap', icon: 'moon-outline' },
];

const APP_MODES: { key: AppMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'pribadi', label: 'Pribadi', icon: 'person-outline' },
  { key: 'keluarga', label: 'Keluarga', icon: 'people-outline' },
];

export default function Settings() {
  const C = useColors();
  const { mode, setMode } = useThemeMode();
  const family = useFamily();
  const [memberName, setMemberName] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const { receipts } = useStore();
  const [exporting, setExporting] = useState<'folder' | 'share' | null>(null);

  const update = async () => {
    setBusy(true);
    try {
      // 1) Pembaruan kode (OTA): otomatis terpasang dan aplikasi dimuat ulang.
      setStatus('Memeriksa pembaruan…');
      if (await applyOtaUpdate()) return;

      // 2) Versi APK baru: unduh di dalam aplikasi, lalu tinggal tekan "Pasang".
      const info = await checkForUpdate();
      if (!info.available || !info.apkUrl) {
        setStatus('');
        return Alert.alert('Sudah terbaru', `Anda memakai versi ${currentVersion()}.`);
      }
      const go = await new Promise<boolean>((resolve) =>
        Alert.alert(`Versi ${info.latest} tersedia`, info.notes || 'Unduh dan pasang sekarang?', [
          { text: 'Nanti', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Perbarui', onPress: () => resolve(true) },
        ]),
      );
      if (!go) return setStatus('');
      await downloadAndInstallApk(info.apkUrl, (p) => setStatus(`Mengunduh… ${Math.round(p * 100)}%`));
      setStatus('Tekan "Pasang" pada layar yang muncul.');
    } catch (e: any) {
      setStatus('');
      Alert.alert('Gagal memperbarui', e.message);
    } finally {
      setBusy(false);
    }
  };

  const add = () => {
    const err = addMember(memberName);
    if (err) return Alert.alert('Tidak bisa menambah', err);
    setMemberName('');
  };

  const exportExcel = async (mode: 'folder' | 'share') => {
    if (!receipts.length) return Alert.alert('Belum ada data', 'Catat pengeluaran dulu sebelum membuat backup.');
    setExporting(mode);
    try {
      if (mode === 'share') {
        await shareBackup(receipts, localIso());
      } else {
        const name = await saveBackupToFolder(receipts, localIso());
        if (name) Alert.alert('Backup tersimpan', `${name}\n\n${receipts.length} catatan disimpan di folder yang Anda pilih.`);
      }
    } catch (e: any) {
      Alert.alert('Backup gagal', e?.message ?? 'Coba lagi.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 10, color: C.text }}>Tampilan</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => ({ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: active ? C.accent : C.border, backgroundColor: active ? C.primarySoft : 'transparent', opacity: pressed ? 0.85 : 1 })}>
                <Ionicons name={m.icon} size={24} color={active ? C.accent : C.muted} />
                <Text style={{ marginTop: 6, fontSize: 12, fontWeight: active ? '700' : '500', color: active ? C.accent : C.muted }}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 10, color: C.text }}>Mode</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {APP_MODES.map((m) => {
            const active = family.mode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setAppMode(m.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => ({ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: active ? C.primary : C.border, backgroundColor: active ? C.primary : 'transparent', opacity: pressed ? 0.85 : 1 })}>
                <Ionicons name={m.icon} size={24} color={active ? '#fff' : C.muted} />
                <Text style={{ marginTop: 6, fontSize: 12, fontWeight: '700', color: active ? '#fff' : C.muted }}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {family.mode === 'keluarga' ? (
          <View style={{ marginTop: 14 }}>
            <Text style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>Anggota keluarga muncul sebagai pilihan saat split bill, dan total per orang per hari tampil di Laporan.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {family.members.map((m) => (
                <Chip key={m.id} label={`${m.name}  ✕`} active onPress={() => removeMember(m.id)} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 6 }}>
              <View style={{ flex: 1 }}>
                <Field value={memberName} onChangeText={setMemberName} placeholder="Nama anggota" onSubmitEditing={add} returnKeyType="done" />
              </View>
              <Button title="Tambah" onPress={add} />
            </View>
          </View>
        ) : (
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 10 }}>Pribadi: split bill dengan teman, nama diketik sendiri.</Text>
        )}
      </Card>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Pembaruan aplikasi</Text>
        <Text style={{ color: C.muted, marginBottom: 10 }}>Versi saat ini: {currentVersion()}</Text>
        {status ? <Text style={{ color: C.accent, marginBottom: 10 }}>{status}</Text> : null}
        <Button title="Perbarui sekarang" onPress={update} loading={busy} />
      </Card>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Backup data</Text>
        <Text style={{ color: C.muted, marginBottom: 4 }}>
          Ekspor semua catatan ({receipts.length}) ke file Excel (.xlsx): struk, item, bensin, split bill, dan ringkasan kategori.
        </Text>
        <Text style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Foto struk tidak ikut. Di pemilih folder, pilih Documents atau folder buatan sendiri.</Text>
        <Button title="Simpan ke folder" onPress={() => exportExcel('folder')} loading={exporting === 'folder'} disabled={!!exporting} style={{ marginBottom: 8 }} />
        <Button title="Bagikan (Drive, WhatsApp, email)" kind="ghost" onPress={() => exportExcel('share')} loading={exporting === 'share'} disabled={!!exporting} />
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
