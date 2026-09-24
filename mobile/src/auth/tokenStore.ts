import * as SecureStore from 'expo-secure-store';

const KEY = 'waqt.auth.token';

/**
 * Wraps expo-secure-store to expose a small, mockable token store.
 * SecureStore is backed by Keychain on iOS and EncryptedSharedPreferences on Android.
 */
export const tokenStore = {
  async get(): Promise<string | null> {
    try { return await SecureStore.getItemAsync(KEY); } catch { return null; }
  },
  async set(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEY, token);
  },
  async clear(): Promise<void> {
    try { await SecureStore.deleteItemAsync(KEY); } catch { /* noop */ }
  },
};
