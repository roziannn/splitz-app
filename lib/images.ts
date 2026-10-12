import * as FileSystem from 'expo-file-system/legacy';

const dir = () => FileSystem.documentDirectory + 'receipts/';

/** Yang disimpan di struk hanya nama file; path lengkap dibentuk saat dipakai. */
export const imagePath = (name?: string) => (name ? dir() + name : undefined);

/** Salin foto dari cache kamera/galeri ke penyimpanan tetap aplikasi. */
export async function saveReceiptImage(src: string, id: string): Promise<string | undefined> {
  try {
    await FileSystem.makeDirectoryAsync(dir(), { intermediates: true });
    const name = `${id}-${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: src, to: dir() + name });
    return name;
  } catch {
    return undefined;
  }
}

export const deleteReceiptImage = (name?: string) =>
  name ? FileSystem.deleteAsync(dir() + name, { idempotent: true }).catch(() => {}) : Promise.resolve();
