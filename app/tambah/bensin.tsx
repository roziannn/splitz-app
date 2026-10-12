import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { DateField } from '../../components/DateField';
import { Button, Card, Chip, Field } from '../../components/ui';
import { localIso } from '../../lib/dates';
import { FUEL_TYPES, fmtLiters, parseDec, previousFill, STATIONS } from '../../lib/fuel';
import { parseNum, rupiah, uid } from '../../lib/format';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';
import { Receipt } from '../../lib/types';

export default function Bensin() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { receipts, get, upsert } = useStore();
  const existing = id ? get(id) : undefined;
  const f = existing?.fuel;

  const [date, setDate] = useState(existing?.date ?? localIso());
  const [station, setStation] = useState(existing?.merchant ?? '');
  const [type, setType] = useState(f?.type ?? '');
  const [price, setPrice] = useState(f ? String(f.pricePerLiter) : '');
  const [liters, setLiters] = useState(f ? fmtLiters(f.liters) : '');
  const [total, setTotal] = useState(existing ? String(existing.total) : '');
  const [odo, setOdo] = useState(f?.odometer ? String(f.odometer) : '');

  // Harga/liter dan liter menentukan total; mengubah total menghitung ulang liter.
  const onPrice = (t: string) => {
    setPrice(t);
    const p = parseNum(t), l = parseDec(liters);
    if (p > 0 && l > 0) setTotal(String(Math.round(p * l)));
  };
  const onLiters = (t: string) => {
    setLiters(t);
    const p = parseNum(price), l = parseDec(t);
    if (p > 0 && l > 0) setTotal(String(Math.round(p * l)));
  };
  const onTotal = (t: string) => {
    setTotal(t);
    const p = parseNum(price), tot = parseNum(t);
    if (p > 0 && tot > 0) setLiters(fmtLiters(tot / p));
  };

  const totalNum = Math.round(parseNum(total)); // rupiah dan km: titik/koma = pemisah ribuan
  const litersNum = parseDec(liters);
  const odoNum = Math.round(parseNum(odo));
  const prev = odoNum > 0 ? previousFill(receipts, date, existing?.id) : undefined;
  const distance = prev?.fuel?.odometer && odoNum > prev.fuel.odometer ? odoNum - prev.fuel.odometer : 0;

  const save = () => {
    if (totalNum <= 0) return Alert.alert('Total belum diisi', 'Isi total bayar, atau harga per liter dan jumlah liter.');
    const name = type.trim() || 'BBM';
    const r: Receipt = {
      id: existing?.id ?? uid(),
      merchant: station.trim() || 'SPBU',
      date,
      items: [{ id: existing?.items[0]?.id ?? uid(), name: litersNum > 0 ? `${name} · ${fmtLiters(litersNum)} L` : name, qty: 1, price: totalNum, category: 'Transportasi', assignedTo: [] }],
      tax: 0,
      service: 0,
      discount: 0,
      total: totalNum,
      people: [],
      createdAt: existing?.createdAt ?? Date.now(),
      image: existing?.image,
      source: 'bensin',
      fuel: { type: name, liters: litersNum, pricePerLiter: parseNum(price), ...(odoNum > 0 ? { odometer: odoNum } : {}) },
    };
    upsert(r);
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Card>
        <DateField label="Tanggal" value={date} onChange={(v) => v && setDate(v)} />
        <Field label="SPBU" value={station} onChangeText={setStation} placeholder="mis. Pertamina Sudirman" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {STATIONS.map((s) => (
            <Chip key={s} label={s} active={station === s} onPress={() => setStation(s)} />
          ))}
        </View>
      </Card>

      <Card>
        <Field label="Jenis BBM" value={type} onChangeText={setType} placeholder="mis. Pertalite" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
          {FUEL_TYPES.map((t) => (
            <Chip key={t} label={t} active={type === t} onPress={() => setType(t)} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="Harga per liter (Rp)" keyboardType="numeric" value={price} onChangeText={onPrice} placeholder="10000" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Liter" keyboardType="decimal-pad" value={liters} onChangeText={onLiters} placeholder="5,2" />
          </View>
        </View>
        <Field label="Total bayar (Rp)" keyboardType="numeric" value={total} onChangeText={onTotal} placeholder="50000" />
        <Text style={{ fontSize: 22, fontWeight: '800', color: C.primary }}>{rupiah(totalNum)}</Text>
      </Card>

      <Card>
        <Field label="Odometer (km) · opsional" keyboardType="numeric" value={odo} onChangeText={setOdo} placeholder="mis. 15230" />
        {distance > 0 ? (
          <Text style={{ color: C.muted }}>
            Jarak sejak isi sebelumnya: {distance.toLocaleString('id-ID')} km
            {litersNum > 0 ? ` · ≈ ${(distance / litersNum).toFixed(1).replace('.', ',')} km/L (jika tangki diisi penuh)` : ''}
          </Text>
        ) : (
          <Text style={{ color: C.muted, fontSize: 12 }}>Isi odometer di tiap pengisian untuk melihat jarak dan perkiraan konsumsi.</Text>
        )}
      </Card>

      <Button title={existing ? 'Simpan perubahan' : 'Simpan'} onPress={save} />
    </ScrollView>
  );
}
