import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'react-native';

const dir = () => FileSystem.documentDirectory + 'receipts/';

/** Sisi terpanjang maksimum dan kualitas JPEG untuk foto yang disimpan (cukup untuk membaca struk). */
const MAX_SIDE = 1280;
const QUALITY = 0.6;

/** Yang disimpan di struk hanya nama file; path lengkap dibentuk saat dipakai. */
export const imagePath = (name?: string) => (name ? dir() + name : undefined);

const sizeOf = (uri: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => Image.getSize(uri, (width, height) => resolve({ width, height }), reject));

/**
 * Perkecil dan kompres foto menjadi JPEG. Jika modul native belum ada di APK (APK lama),
 * atau proses gagal, kembalikan foto asli supaya penyimpanan tetap berjalan.
 */
async function compress(src: string): Promise<string> {
  try {
    const { manipulateAsync, SaveFormat } = require('expo-image-manipulator') as typeof import('expo-image-manipulator');
    const { width, height } = await sizeOf(src);
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    const actions = scale < 1 ? [{ resize: width >= height ? { width: Math.round(width * scale) } : { height: Math.round(height * scale) } }] : [];
    const out = await manipulateAsync(src, actions, { compress: QUALITY, format: SaveFormat.JPEG });
    return out.uri;
  } catch {
    return src;
  }
}

/** Kompres lalu salin foto ke penyimpanan tetap aplikasi. */
export async function saveReceiptImage(src: string, id: string): Promise<string | undefined> {
  try {
    await FileSystem.makeDirectoryAsync(dir(), { intermediates: true });
    const name = `${id}-${Date.now()}.jpg`;
    const small = await compress(src);
    await FileSystem.copyAsync({ from: small, to: dir() + name });
    if (small !== src) FileSystem.deleteAsync(small, { idempotent: true }).catch(() => {});
    return name;
  } catch {
    return undefined;
  }
}

export const deleteReceiptImage = (name?: string) =>
  name ? FileSystem.deleteAsync(dir() + name, { idempotent: true }).catch(() => {}) : Promise.resolve();
