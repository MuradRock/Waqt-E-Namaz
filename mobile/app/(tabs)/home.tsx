import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { listSubscriptions, SubscriptionWithMosque } from '../../src/api/subscriptions';

export default function HomeScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<SubscriptionWithMosque[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await listSubscriptions()); }
    catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{t('home.noSubscriptions')}</Text>
        <Link href="/(tabs)/search" style={styles.link}>{t('home.findNearby')}</Link>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={items}
      keyExtractor={(s) => s.id}
      renderItem={({ item }) => (
        <TouchableOpacity>
          <Link href={{ pathname: '/mosque/[id]', params: { id: item.mosque.id } }} style={styles.card}>
            <View>
              <Text style={styles.name}>{item.mosque.name}</Text>
              <Text style={styles.addr}>
                {item.mosque.streetAddress}, {item.mosque.city}, {item.mosque.country}
              </Text>
            </View>
          </Link>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  empty:  { fontSize: 16, marginBottom: 12, textAlign: 'center' },
  link:   { color: '#0b6e4f', fontSize: 16 },
  card:   { padding: 16, backgroundColor: '#f6f7f9', borderRadius: 12, marginBottom: 12 },
  name:   { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  addr:   { color: '#666' },
});
