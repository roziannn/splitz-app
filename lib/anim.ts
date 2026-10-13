import { LayoutAnimation, Platform, UIManager } from 'react-native';

// Arsitektur lama di Android perlu diaktifkan; arsitektur baru (Fabric) sudah mendukung dan tidak perlu.
if (Platform.OS === 'android' && !(globalThis as any).nativeFabricUIManager && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Panggil tepat sebelum mengubah daftar (tambah/hapus item) agar perubahannya bergeser halus. */
export const animate = () => LayoutAnimation.configureNext(LayoutAnimation.create(180, 'easeInEaseOut', 'opacity'));
