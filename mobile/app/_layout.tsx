import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initI18n } from '../src/i18n';
import { useAuthStore } from '../src/auth/authStore';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    (async () => {
      await initI18n();
      await bootstrap();
      setReady(true);
    })();
  }, [bootstrap]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: true }} />
    </SafeAreaProvider>
  );
}
