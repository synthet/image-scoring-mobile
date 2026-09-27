import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { SECURE_KEYS } from '@/config/env';

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(SECURE_KEYS.deviceId);
  if (existing) {
    return existing;
  }
  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync(SECURE_KEYS.deviceId, id);
  return id;
}

export async function getApiBaseUrl(): Promise<string> {
  const stored = await SecureStore.getItemAsync(SECURE_KEYS.apiBaseUrl);
  if (stored) {
    return stored.replace(/\/$/, '');
  }
  const { DEFAULT_API_BASE_URL } = await import('@/config/env');
  return DEFAULT_API_BASE_URL;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_KEYS.apiBaseUrl, url.replace(/\/$/, ''));
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_KEYS.accessToken);
}

export async function setAccessToken(token: string | null): Promise<void> {
  if (!token) {
    await SecureStore.deleteItemAsync(SECURE_KEYS.accessToken);
    return;
  }
  await SecureStore.setItemAsync(SECURE_KEYS.accessToken, token);
}
