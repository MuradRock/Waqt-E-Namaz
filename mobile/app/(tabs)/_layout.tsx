import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#0b6e4f' }}>
      <Tabs.Screen name="home"     options={{ title: t('home.subscriptions') }} />
      <Tabs.Screen name="search"   options={{ title: t('search.title') }} />
      <Tabs.Screen name="settings" options={{ title: t('settings.title') }} />
    </Tabs>
  );
}
