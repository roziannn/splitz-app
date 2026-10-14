import * as FileSystem from 'expo-file-system/legacy';
import { workbookBase64 } from './backup';
import { buildPdfBase64 } from './pdf';
import { Person, Receipt } from './types';

export type ExportFormat = 'xlsx' | 'pdf';

const MIME: Record<ExportFormat, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};
const UTI: Record<ExportFormat, string> = { xlsx: 'org.openxmlformats.spreadsheetml.sheet', pdf: 'com.adobe.pdf' };

export interface ExportInput {
  format: ExportFormat;
  receipts: Receipt[]; // semua catatan; rentang disaring di sini
  from: string;
  to: string;
  members?: Person[];
}

/** Isi berkas (base64) dan nama dasarnya untuk rentang yang dipilih. */
function build({ format, receipts, from, to, members = [] }: ExportInput) {
  const inRange = receipts.filter((r) => r.date >= from && r.date <= to);
  const base64 = format === 'pdf' ? buildPdfBase64(receipts, from, to, members) : workbookBase64(inRange);
  return { base64, name: `Splitz-${from}_${to}`, count: inRange.length };
}

/** Pilih folder (mis. Documents), lalu simpan berkas di sana. Mengembalikan nama berkas, atau null jika dibatalkan. */
export async function exportToFolder(input: ExportInput): Promise<string | null> {
  const saf = FileSystem.StorageAccessFramework;
  const perm = await saf.requestDirectoryPermissionsAsync();
  if (!perm.granted) return null;
  const { base64, name } = build(input);
  const uri = await saf.createFileAsync(perm.directoryUri, name, MIME[input.format]);
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  return `${name}.${input.format}`;
}

/** Bagikan atau cetak lewat menu berbagi Android (Drive, WhatsApp, email, Cetak, dll.). */
export async function exportShare(input: ExportInput): Promise<void> {
  // Dimuat saat dipakai: APK lama tanpa modul ini tidak crash, hanya menampilkan pesan.
  let Sharing: typeof import('expo-sharing');
  try {
    Sharing = require('expo-sharing');
    if (!(await Sharing.isAvailableAsync())) throw new Error('unavailable');
  } catch {
    throw new Error('Fitur bagikan butuh versi aplikasi terbaru. Gunakan "Simpan ke folder" dulu.');
  }
  const { base64, name } = build(input);
  const path = `${FileSystem.cacheDirectory}${name}.${input.format}`;
  await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 });
  await Sharing.shareAsync(path, { mimeType: MIME[input.format], dialogTitle: 'Ekspor Splitz', UTI: UTI[input.format] });
}

export const countInRange = (receipts: Receipt[], from: string, to: string) => receipts.filter((r) => r.date >= from && r.date <= to).length;
