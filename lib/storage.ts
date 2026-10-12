import AsyncStorage from '@react-native-async-storage/async-storage';
import { Receipt } from './types';

const KEY = 'splitz.receipts.v1';

export async function loadReceipts(): Promise<Receipt[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const saveReceipts = (r: Receipt[]) => AsyncStorage.setItem(KEY, JSON.stringify(r));
