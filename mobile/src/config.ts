import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolves the API base URL. Priority:
 *   1. EXPO_PUBLIC_API_BASE_URL env var (exposed to the JS bundle at build time)
 *   2. app.json -> expo.extra.apiBaseUrl
 *   3. Sensible per-platform default for local dev
 *      - Android emulator: 10.0.2.2 (host loopback)
 *      - iOS simulator / Web / other: localhost
 */
const extra = (Constants.expoConfig?.extra ?? {}) as { apiBaseUrl?: string };

const defaultBase = Platform.select({
  android: 'http://10.0.2.2:4000/api/v1',
  ios: 'http://localhost:4000/api/v1',
  default: 'http://localhost:4000/api/v1',
});

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? extra.apiBaseUrl ?? defaultBase;
