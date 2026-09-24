import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getCalendar, getMosque, Mosque, MosqueCalendar } from '../../src/api/mosques';
import { listSubscriptions, subscribe, unsubscribe, updatePreferences, Subscription, PreferencePatch } from '../../src/api/subscriptions';
import { cancelAllForMosque, ensurePermissions, rescheduleForMosque } from '../../src/reminders/scheduler';

const PRAYERS: Array<['fajr' | 'zuhr' | 'asr' | 'maghrib' | 'isha', keyof Subscription]> = [
  ['fajr', 'fajrEnabled'], ['zuhr', 'zuhrEnabled'], ['asr', 'asrEnabled'],
  ['maghrib', 'maghribEnabled'], ['isha', 'ishaEnabled'],
];

export default function MosqueScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [calendar, setCalendar] = useState<MosqueCalendar | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setBusy(true);
    try {
      const m = await getMosque(id);
      setMosque(m);

      const today = new Date().toISOString().slice(0, 10);
      const { calendar } = await getCalendar(id, today);
      setCalendar(calendar);

      const subs = await listSubscriptions();
      setSubscription(subs.find((s) => s.mosqueId === id) ?? null);
    } finally { setBusy(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleSubscribe() {
    if (!mosque) return;
    await ensurePermissions();
    const sub = await subscribe(mosque.id);
    setSubscription(sub);
    if (calendar) await rescheduleForMosque(mosque, sub, [calendar]);
  }

  async function handleUnsubscribe() {
    if (!mosque) return;
    await unsubscribe(mosque.id);
    await cancelAllForMosque(mosque.id);
    setSubscription(null);
  }

  async function togglePreference(field: keyof Subscription, value: boolean) {
    if (!subscription || !mosque) return;
    const prev = subscription;
    const optimistic = { ...subscription, [field]: value } as Subscription;
    setSubscription(optimistic);
    try {
      const patch = { [field]: value } as PreferencePatch;
      const updated = await updatePreferences(mosque.id, patch);
      setSubscription(updated);
      if (calendar) await rescheduleForMosque(mosque, updated, [calendar]);
    } catch {
      setSubscription(prev);
      Alert.alert(t('common.error'), t('reminders.revertOnFail'));
    }
  }

  if (busy || !mosque) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <FlatList
      ListHeaderComponent={
        <View>
          <Text style={styles.name}>{mosque.name}</Text>
          <Text style={styles.addr}>{mosque.streetAddress}, {mosque.city}, {mosque.country}</Text>

          <View style={styles.actions}>
            {subscription
              ? <Button title="Unsubscribe" color="#c0392b" onPress={handleUnsubscribe} />
              : <Button title="Subscribe" onPress={handleSubscribe} />}
          </View>

          <Text style={styles.h2}>{t('reminders.title')}</Text>
          {subscription && PRAYERS.map(([label, key]) => (
            <View key={label} style={styles.rowBetween}>
              <Text style={styles.rowLabel}>{t(`prayers.${label}`)}</Text>
              <Switch
                value={Boolean(subscription[key])}
                onValueChange={(v) => togglePreference(key, v)}
              />
            </View>
          ))}

          <Text style={styles.h2}>{new Date().toISOString().slice(0, 10)}</Text>
        </View>
      }
      contentContainerStyle={{ padding: 16 }}
      data={calendar && !calendar.empty ? buildRows(calendar) : []}
      keyExtractor={(r) => r.label}
      ListEmptyComponent={<Text style={styles.empty}>{t('common.empty')}</Text>}
      renderItem={({ item }) => (
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>{item.label}</Text>
          <Text>{item.azan ?? '—'} · {item.namaz ?? '—'}</Text>
        </View>
      )}
    />
  );
}

function buildRows(cal: MosqueCalendar) {
  const isFriday = new Date(`${cal.date}T00:00:00.000Z`).getUTCDay() === 5;
  const rows = [
    { label: 'Fajr',    azan: cal.fajrAzan,    namaz: cal.fajrNamaz },
    isFriday
      ? { label: "Jumu'ah", azan: cal.jumuahAzan, namaz: cal.jumuahNamaz }
      : { label: 'Zuhr',    azan: cal.zuhrAzan,   namaz: cal.zuhrNamaz },
    { label: 'Asr',     azan: cal.asrAzan,     namaz: cal.asrNamaz },
    { label: 'Maghrib', azan: cal.maghribAzan, namaz: cal.maghribNamaz },
    { label: 'Isha',    azan: cal.ishaAzan,    namaz: cal.ishaNamaz },
  ];
  if (cal.suhoor) rows.unshift({ label: 'Suhoor', azan: cal.suhoor, namaz: null });
  if (cal.iftar) {
    const idx = rows.findIndex((r) => r.label === 'Maghrib');
    rows.splice(idx, 0, { label: 'Iftar', azan: cal.iftar, namaz: null });
  }
  return rows;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name:   { fontSize: 22, fontWeight: '600' },
  addr:   { color: '#666', marginTop: 4 },
  actions:{ marginTop: 16, marginBottom: 8 },
  h2:     { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLabel:   { fontSize: 16 },
  timeRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  timeLabel:  { fontWeight: '600' },
  empty:      { textAlign: 'center', color: '#666', marginTop: 24 },
});
