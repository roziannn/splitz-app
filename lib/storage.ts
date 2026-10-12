import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Receipt } from './types';

const KEY = 'splitz.receipts.v1';
const API_KEY = 'splitz.anthropic_key';

export async function loadReceipts(): Promise<Receipt[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const saveReceipts = (r: Receipt[]) => AsyncStorage.setItem(KEY, JSON.stringify(r));

export const getApiKey = () => SecureStore.getItemAsync(API_KEY);
export const setApiKey = (k: string) => (k ? SecureStore.setItemAsync(API_KEY, k) : SecureStore.deleteItemAsync(API_KEY));
