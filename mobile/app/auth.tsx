import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../src/auth/authStore';
import { ApiError } from '../src/api/client';

export default function AuthScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  async function submit() {
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, displayName);
      router.replace('/(tabs)/home');
    } catch (e) {
      const err = e as ApiError;
      Alert.alert(t('common.error'), err.message);
    } finally { setBusy(false); }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('common.appName')}</Text>

      <TextInput style={styles.input} placeholder={t('auth.email')} autoCapitalize="none"
        keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder={t('auth.password')} secureTextEntry
        value={password} onChangeText={setPassword} />
      {mode === 'register' && (
        <TextInput style={styles.input} placeholder={t('auth.displayName')}
          value={displayName} onChangeText={setDisplayName} />
      )}

      <Button title={busy ? t('common.loading') : mode === 'login' ? t('auth.login') : t('auth.register')}
        onPress={submit} disabled={busy} />

      <Text style={styles.link} onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '600', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#d0d0d0', borderRadius: 8, padding: 12, marginBottom: 12 },
  link: { textAlign: 'center', marginTop: 16, color: '#0b6e4f' },
});
