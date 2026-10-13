import { Alert } from 'react-native';

// Kesalahan JS yang fatal biasanya langsung menutup aplikasi tanpa keterangan.
// Di sini pesannya ditampilkan agar penyebabnya bisa diketahui dan diperbaiki.
const EU = (globalThis as any).ErrorUtils;
let showing = false;

if (EU?.setGlobalHandler) {
  EU.setGlobalHandler((e: any, isFatal?: boolean) => {
    if (!isFatal || showing) return;
    showing = true;
    setTimeout(() => {
      try {
        Alert.alert('Terjadi kesalahan', String(e?.message ?? e).slice(0, 500), [{ text: 'OK', onPress: () => { showing = false; } }]);
      } catch {
        showing = false;
      }
    }, 300);
  });
}
