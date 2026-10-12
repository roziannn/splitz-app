import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { DateField } from '../../components/DateField';
import { MoneyField } from '../../components/MoneyField';
import { Button, Card, Chip, Field } from '../../components/ui';
import { localIso } from '../../lib/dates';
import { FUEL_TYPES, fmtLiters, previousFill, STATIONS } from '../../lib/fuel';
import { uid } from '../../lib/format';
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
  const [priceNum, setPrice] = useState(f?.pricePerLiter ?? 0);
  const [totalNum, setTotal] = useState(existing?.total ?? 0);
  const [odoNum, setOdo] = useState(f?.odometer ?? 0);

  const litersNum = priceNum > 0 && totalNum > 0 ? Math.round((totalNum / priceNum) * 100) / 100 : 0; // otomatis, tidak diketik
  const prev = odoNum > 0 ? previousFill(receipts, date, existing?.id) : undefined;
  const distance = prev?.fuel?.odometer && odoNum > prev.fuel.odometer ? odoNum - prev.fuel.odometer : 0;

  const save = () => {
    if (totalNum <= 0) return Alert.alert('Total belum diisi', 'Isi total bayar (nominal yang dibayar).');
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
      fuel: { type: name, liters: litersNum, pricePerLiter: priceNum, ...(odoNum > 0 ? { odometer: odoNum } : {}) },
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
            <MoneyField label="Harga per liter" value={priceNum} onChange={setPrice} placeholder="10.000" />
          </View>
          <View style={{ flex: 1 }}>
            <MoneyField label="Total bayar" value={totalNum} onChange={setTotal} placeholder="50.000" />
          </View>
        </View>
        <Field
          label="Liter (otomatis)"
          value={litersNum > 0 ? `${fmtLiters(litersNum)} L` : ''}
          editable={false}
          placeholder="Terisi dari total ÷ harga per liter"
          style={{ backgroundColor: C.bg, color: C.muted }}
        />
      </Card>

      <Card>
        <MoneyField label="Odometer · opsional" prefix="" suffix="km" value={odoNum} onChange={setOdo} placeholder="mis. 15.230" />
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
