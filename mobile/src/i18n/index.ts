import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import en from './locales/en';
import hi from './locales/hi';
import ur from './locales/ur';

export type AppLanguage = 'en' | 'hi' | 'ur';
export const SUPPORTED: AppLanguage[] = ['en', 'hi', 'ur'];
const STORAGE_KEY = 'waqt.language';

async function detectInitialLanguage(): Promise<AppLanguage> {
  try {
    const saved = (await AsyncStorage.getItem(STORAGE_KEY)) as AppLanguage | null;
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch { /* ignore */ }
  const device = Localization.getLocales()[0]?.languageCode ?? 'en';
  return (SUPPORTED as string[]).includes(device) ? (device as AppLanguage) : 'en';
}

export async function initI18n(): Promise<void> {
  const lng = await detectInitialLanguage();
  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      ur: { translation: ur },
    },
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  applyDirection(lng);
}

/**
 * Persists the selection first (Requirement 12.4: keep previous language if
 * persistence fails). Only mutates i18next after storage succeeds.
 */
export async function setLanguage(lng: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, lng);
  await i18n.changeLanguage(lng);
  applyDirection(lng);
}

function applyDirection(lng: AppLanguage): void {
  const shouldBeRTL = lng === 'ur';
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    // A reload is required for RN layout to apply direction changes.
    // Callers should surface this to the user before setting Urdu.
  }
}

export default i18n;
