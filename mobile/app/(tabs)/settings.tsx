import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { setLanguage, SUPPORTED, AppLanguage } from '../../src/i18n';
import { useAuthStore } from '../../src/auth/authStore';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const logout = useAuthStore((s) => s.logout);

  async function pick(lng: AppLanguage) {
    try { await setLanguage(lng); }
    catch { Alert.alert(t('common.error'), t('settings.persistFailed')); }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>{t('settings.language')}</Text>
      {SUPPORTED.map((lng) => (
        <View key={lng} style={styles.row}>
          <Button
            title={`${t(`settings.languages.${lng}`)}${i18n.language === lng ? '  ✓' : ''}`}
            onPress={() => pick(lng)}
          />
        </View>
      ))}
      <View style={styles.spacer} />
      <Button title={t('auth.logout')} color="#c0392b" onPress={async () => {
        await logout();
        router.replace('/auth');
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  h1: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  row: { marginBottom: 8 },
  spacer: { height: 24 },
});
