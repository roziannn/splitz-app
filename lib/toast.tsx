import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/Text';
import { useColors } from './themeContext';

type Kind = 'success' | 'error' | 'info';
interface Msg { id: number; text: string; kind: Kind }

let show: ((text: string, kind: Kind) => void) | null = null;

/** Notifikasi singkat di atas layar. Aman dipanggil dari mana saja (mis. sebelum router.back()). */
export const toast = {
  success: (text: string) => show?.(text, 'success'),
  error: (text: string) => show?.(text, 'error'),
  info: (text: string) => show?.(text, 'info'),
};

const ICON: Record<Kind, keyof typeof Ionicons.glyphMap> = { success: 'checkmark-circle', error: 'close-circle', info: 'information-circle' };
const TINT: Record<Kind, string> = { success: '#22c55e', error: '#f87171', info: '#60a5fa' };

/** Pasang sekali di layout paling atas. */
export function ToastHost() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<Msg | null>(null);
  const v = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    show = (text, kind) => {
      if (timer.current) clearTimeout(timer.current);
      setMsg({ id: ++seq.current, text, kind });
      Animated.spring(v, { toValue: 1, useNativeDriver: true, bounciness: 4, speed: 18 }).start();
      timer.current = setTimeout(() => {
        Animated.timing(v, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMsg(null));
      }, kind === 'error' ? 3800 : 2400);
    };
    return () => { show = null; if (timer.current) clearTimeout(timer.current); };
  }, [v]);

  if (!msg) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: 16, right: 16, top: insets.top + 8, zIndex: 100, elevation: 12, opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.snackBg, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 }}>
        <Ionicons name={ICON[msg.kind]} size={22} color={TINT[msg.kind]} />
        <Text style={{ flex: 1, color: C.snackText, fontWeight: '600' }}>{msg.text}</Text>
      </View>
    </Animated.View>
  );
}
