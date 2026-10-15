import { Ionicons } from '@expo/vector-icons';
import { Image, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Text } from './Text';
import { Account, providerInfo, typeInfo } from '../lib/accounts';
import { BANK_LOGOS } from '../lib/bankLogos';
import { EWALLET_LOGOS } from '../lib/ewalletLogos';

/** Logo rekening: logo asli bila ada (bank SVG, e-wallet PNG), lalu lencana warna dan tulisan merek, selain itu ikon jenis rekening. */
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
  const png = EWALLET_LOGOS[p.key];
  if (png) {
    return (
      <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}>
        <Image source={png} style={{ width: size - 2, height: size - 2 }} resizeMode="cover" />
      </View>
    );
  }
  const xml = BANK_LOGOS[p.key];
  if (xml) {
    return (
      <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}>
        <SvgXml xml={xml} width={size - 2} height={size - 2} />
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: p.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }}>
      <Text style={{ color: p.fg, fontWeight: '800', fontSize: size * 0.26 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{p.mark}</Text>
    </View>
  );
}
