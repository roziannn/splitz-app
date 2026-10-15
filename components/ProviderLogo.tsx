import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Text } from './Text';
import { Account, providerInfo, typeInfo } from '../lib/accounts';

/** Lencana logo rekening: warna dan tulisan merek bila dipilih, selain itu ikon jenis rekening. */
export function ProviderLogo({ account, size = 40, onLight }: { account: Pick<Account, 'type' | 'provider' | 'color'>; size?: number; onLight?: boolean }) {
  const p = providerInfo(account.provider);
  const radius = Math.round(size * 0.28);
  if (!p) {
    return (
      <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: onLight ? account.color : 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={typeInfo(account.type).icon} size={size * 0.5} color="#fff" />
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: p.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }}>
      <Text style={{ color: p.fg, fontWeight: '800', fontSize: size * 0.26 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{p.mark}</Text>
    </View>
  );
}
