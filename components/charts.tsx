import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import { compact, CatSlice, DayPoint } from '../lib/report';
import { rupiah } from '../lib/format';
import { C, CAT_COLOR, SERIES } from '../lib/theme';

// Dimuat saat render (bukan saat start) supaya APK lama tanpa modul native tidak crash; ChartBoundary menangkapnya.
const loadSvg = () => {
  const m = require('react-native-svg') as typeof import('react-native-svg');
  return { Svg: m.default, Circle: m.Circle, G: m.G, Line: m.Line, Path: m.Path, Rect: m.Rect, SvgText: m.Text };
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const short = (iso: string) => `${+iso.slice(8, 10)} ${MONTHS[+iso.slice(5, 7) - 1]}`;

/** Jika modul native react-native-svg belum ada di APK lama, tampilkan pengganti alih-alih crash. */
export class ChartBoundary extends React.Component<{ children: React.ReactNode; note?: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return <Text style={{ color: C.muted, paddingVertical: 12 }}>{this.props.note ?? 'Grafik tampil setelah aplikasi diperbarui ke versi terbaru (build APK baru).'}</Text>;
  }
}

const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((k) => n <= k) ?? 10;
  return step * p;
};

/** Garis tren total belanja per hari. Ketuk bagian grafik untuk melihat nilai hari itu. */
export function LineChart({ points, height = 190 }: { points: DayPoint[]; height?: number }) {
  const { Svg, Circle, G, Line, Path, Rect, SvgText } = loadSvg();
  const [w, setW] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const n = points.length;
  const active = sel ?? n - 1;
  const padL = 38, padR = 10, padT = 10, padB = 24;
  const top = niceMax(Math.max(...points.map((p) => p.value), 0));
  const iw = Math.max(0, w - padL - padR);
  const ih = height - padT - padB;
  const x = (i: number) => padL + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => padT + ih - (v / top) * ih;

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const area = n > 1 ? `${line} L${x(n - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z` : '';
  const ticks = [0, 0.5, 1];
  const xl = n <= 1 ? [0] : n <= 7 ? points.map((_, i) => i) : [0, Math.floor((n - 1) / 2), n - 1];
  const p = points[active];

  return (
    <View>
      <Text style={{ color: C.text, fontWeight: '700' }}>
        {p ? `${short(p.date)} · ${rupiah(p.value)}` : ''}
      </Text>
      <View onLayout={onLayout} style={{ height, marginTop: 4 }}>
        {w > 0 ? (
          <Svg width={w} height={height}>
            {ticks.map((t) => (
              <G key={t}>
                <Line x1={padL} x2={w - padR} y1={y(top * t)} y2={y(top * t)} stroke={C.border} strokeWidth={1} />
                <SvgText x={padL - 6} y={y(top * t) + 3} fontSize={10} fill={C.muted} textAnchor="end">
                  {compact(top * t)}
                </SvgText>
              </G>
            ))}
            {area ? <Path d={area} fill={SERIES} opacity={0.1} /> : null}
            {n > 1 ? <Path d={line} stroke={SERIES} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" /> : null}
            {/* penanda hanya pada titik terpilih, dengan cincin permukaan agar tidak menyatu dengan garis */}
            {p ? (
              <G>
                <Line x1={x(active)} x2={x(active)} y1={padT} y2={y(0)} stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
                <Circle cx={x(active)} cy={y(p.value)} r={6} fill="#fff" />
                <Circle cx={x(active)} cy={y(p.value)} r={4} fill={SERIES} />
              </G>
            ) : null}
            {xl.map((i) => (
              <SvgText key={i} x={x(i)} y={height - 6} fontSize={10} fill={C.muted} textAnchor={i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle'}>
                {short(points[i].date)}
              </SvgText>
            ))}
            {/* area sentuh: satu kolom lebar per titik */}
            {points.map((_, i) => {
              const cw = n <= 1 ? iw : iw / (n - 1);
              return <Rect key={i} x={x(i) - cw / 2} y={0} width={cw} height={height} fill="transparent" onPress={() => setSel(i)} />;
            })}
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

/** Donat porsi pengeluaran per kategori. Ketuk irisan atau baris legenda untuk menyorot. */
export function Donut({ slices, total, size = 190 }: { slices: CatSlice[]; total: number; size?: number }) {
  const { Svg, Circle, G } = loadSvg();
  const [sel, setSel] = useState<string | null>(null);
  const stroke = 28;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const gap = slices.length > 1 ? 2 : 0; // celah permukaan antar irisan
  const cur = slices.find((s) => s.name === sel);

  let acc = 0;
  return (
    <View>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size}>
            <G rotation={-90} origin={`${c}, ${c}`}>
              {slices.map((s) => {
                const len = (s.value / total) * circ;
                const dash = Math.max(0, len - gap);
                const el = (
                  <Circle
                    key={s.name}
                    cx={c}
                    cy={c}
                    r={r}
                    fill="none"
                    stroke={CAT_COLOR[s.name] ?? C.muted}
                    strokeWidth={cur?.name === s.name ? stroke + 6 : stroke}
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeDashoffset={-acc}
                    opacity={cur && cur.name !== s.name ? 0.35 : 1}
                    onPress={() => setSel(sel === s.name ? null : s.name)}
                  />
                );
                acc += len;
                return el;
              })}
            </G>
          </Svg>
          <View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.muted, fontSize: 12 }}>{cur ? cur.name : 'Total'}</Text>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>{rupiah(cur ? cur.value : total)}</Text>
            {cur ? <Text style={{ color: C.muted, fontSize: 12 }}>{cur.pct.toFixed(0)}%</Text> : null}
          </View>
        </View>
      </View>

      {/* legenda sekaligus tabel nilai: identitas tidak bergantung pada warna saja */}
      <View style={{ marginTop: 12 }}>
        {slices.map((s) => (
          <Pressable
            key={s.name}
            onPress={() => setSel(sel === s.name ? null : s.name)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, opacity: cur && cur.name !== s.name ? 0.5 : 1 }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: CAT_COLOR[s.name] ?? C.muted, marginRight: 10 }} />
            <Text style={{ flex: 1, color: C.text }}>{s.name}</Text>
            <Text style={{ color: C.text, fontWeight: '600' }}>{rupiah(s.value)}</Text>
            <Text style={{ color: C.muted, width: 44, textAlign: 'right' }}>{s.pct.toFixed(0)}%</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
