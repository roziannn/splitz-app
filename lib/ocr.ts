import { recognizeText } from '@infinitered/react-native-mlkit-text-recognition';
import { OcrLine, parseReceipt } from './parse';
import { Receipt } from './types';

/** OCR dilakukan di HP (Google ML Kit), tanpa internet dan tanpa API key. */
export async function scanReceipt(uri: string): Promise<Receipt> {
  let result;
  try {
    result = await recognizeText(uri);
  } catch (e: any) {
    throw new Error(`OCR gagal: ${e?.message ?? e}. Fitur ini hanya jalan di APK hasil build (bukan Expo Go).`);
  }
  const lines: OcrLine[] = result.blocks.flatMap((b) =>
    b.lines.map((l) => ({ text: l.text, top: l.frame.top, bottom: l.frame.bottom, left: l.frame.left })),
  );
  if (!lines.length) throw new Error('Teks tidak terbaca. Coba foto yang lebih jelas dan terang.');
  const receipt = parseReceipt(lines);
  if (!receipt.items.length) throw new Error('Item tidak terdeteksi. Coba foto lebih dekat, atau isi manual.');
  return receipt;
}
