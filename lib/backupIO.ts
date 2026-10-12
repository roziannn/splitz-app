import * as FileSystem from 'expo-file-system/legacy';
import { backupFileName, workbookBase64 } from './backup';
import { Receipt } from './types';

const MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Pilih folder (mis. Documents), lalu simpan file Excel di sana. Mengembalikan nama file, atau null jika dibatalkan. */
export async function saveBackupToFolder(receipts: Receipt[], todayIso: string): Promise<string | null> {
  const saf = FileSystem.StorageAccessFramework;
  const perm = await saf.requestDirectoryPermissionsAsync();
  if (!perm.granted) return null;
  const base = backupFileName(todayIso);
  const uri = await saf.createFileAsync(perm.directoryUri, base, MIME);
  await FileSystem.writeAsStringAsync(uri, workbookBase64(receipts), { encoding: FileSystem.EncodingType.Base64 });
  return `${base}.xlsx`;
}

/** Bagikan file Excel lewat menu berbagi Android (Drive, WhatsApp, email, dll.). */
export async function shareBackup(receipts: Receipt[], todayIso: string): Promise<void> {
  // Dimuat saat dipakai: APK lama tanpa modul ini tidak crash, hanya menampilkan pesan.
  let Sharing: typeof import('expo-sharing');
  try {
    Sharing = require('expo-sharing');
    if (!(await Sharing.isAvailableAsync())) throw new Error('unavailable');
  } catch {
    throw new Error('Fitur bagikan butuh versi aplikasi terbaru. Gunakan "Simpan ke folder" dulu.');
  }
  const path = `${FileSystem.cacheDirectory}${backupFileName(todayIso)}.xlsx`;
  await FileSystem.writeAsStringAsync(path, workbookBase64(receipts), { encoding: FileSystem.EncodingType.Base64 });
  await Sharing.shareAsync(path, { mimeType: MIME, dialogTitle: 'Backup Splitz', UTI: 'org.openxmlformats.spreadsheetml.sheet' });
}
