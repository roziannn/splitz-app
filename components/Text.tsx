import { Text as RNText, TextProps } from 'react-native';
import { useColors } from '../lib/themeContext';

/** Teks yang warna dasarnya mengikuti tema (terang/gelap). Warna eksplisit di `style` tetap menang. */
export function Text(props: TextProps) {
  const C = useColors();
  return <RNText {...props} style={[{ color: C.text }, props.style]} />;
}
