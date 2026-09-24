import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Mosque, searchNearby } from '../../src/api/mosques';

export default function SearchScreen() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'denied' | 'error'>('idle');
  const [items, setItems] = useState<Mosque[]>([]);
  const [radiusKm] = useState(5);

  async function run() {
    setStatus('loading');
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') { setStatus('denied'); return; }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const results = await searchNearby(pos.coords.latitude, pos.coords.longitude, radiusKm);
      setItems(results);
      setStatus('ready');
    } catch { setStatus('error'); }
  }

  useEffect(() => { run(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  if (status === 'loading' || status === 'idle') return <View style={styles.center}><ActivityIndicator /></View>;
  if (status === 'denied') return <View style={styles.center}><Text>{t('search.permissionDenied')}</Text></View>;
  if (status === 'error')  return <View style={styles.center}><Text>{t('common.error')}</Text><Button title={t('common.retry')} onPress={run} /></View>;
  if (items.length === 0)  return <View style={styles.center}><Text>{t('search.noResults', { radius: radiusKm })}</Text></View>;

  return (
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={items}
      keyExtractor={(m) => m.id}
      renderItem={({ item }) => (
        <Link href={{ pathname: '/mosque/[id]', params: { id: item.id } }} style={styles.card}>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.addr}>{item.streetAddress}, {item.city}</Text>
            {item.distanceKm != null && <Text style={styles.dist}>{item.distanceKm.toFixed(2)} km</Text>}
          </View>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card:   { padding: 16, backgroundColor: '#f6f7f9', borderRadius: 12, marginBottom: 12 },
  name:   { fontSize: 18, fontWeight: '600' },
  addr:   { color: '#666', marginTop: 4 },
  dist:   { color: '#0b6e4f', marginTop: 4 },
});
