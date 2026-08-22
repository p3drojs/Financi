import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memory = new Map<string, string>();

function webStorage(): Storage | null {
  if (Platform.OS !== 'web') return null;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export async function readItem(key: string): Promise<string | null> {
  const web = webStorage();
  if (web) return web.getItem(key);
  if (Platform.OS === 'web') return memory.get(key) ?? null;

  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function writeItem(key: string, value: string): Promise<void> {
  const web = webStorage();
  if (web) {
    web.setItem(key, value);
    return;
  }
  if (Platform.OS === 'web') {
    memory.set(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

export async function removeItem(key: string): Promise<void> {
  const web = webStorage();
  if (web) {
    web.removeItem(key);
    return;
  }
  if (Platform.OS === 'web') {
    memory.delete(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}
