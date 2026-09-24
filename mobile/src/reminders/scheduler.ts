import * as Notifications from 'expo-notifications';
import i18n from '../i18n';
import type { MosqueCalendar, Mosque } from '../api/mosques';
import type { Subscription } from '../api/subscriptions';
import { getTone } from './tones';

// Foreground notification handler.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensurePermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

type PrayerSlot = { key: 'fajr' | 'zuhr' | 'asr' | 'maghrib' | 'isha'; azan: string | null; enabled: boolean };

function tagFor(mosqueId: string, date: string, prayer: string) {
  return `waqt:${mosqueId}:${date}:${prayer}`;
}

function slotsFor(cal: MosqueCalendar, sub: Subscription): PrayerSlot[] {
  const isFriday = new Date(`${cal.date}T00:00:00.000Z`).getUTCDay() === 5;
  const zuhrAzan = isFriday ? cal.jumuahAzan : cal.zuhrAzan;
  return [
    { key: 'fajr',    azan: cal.fajrAzan,    enabled: sub.fajrEnabled },
    { key: 'zuhr',    azan: zuhrAzan,        enabled: sub.zuhrEnabled },
    { key: 'asr',     azan: cal.asrAzan,     enabled: sub.asrEnabled },
    { key: 'maghrib', azan: cal.maghribAzan, enabled: sub.maghribEnabled },
    { key: 'isha',    azan: cal.ishaAzan,    enabled: sub.ishaEnabled },
  ];
}

function localTriggerDate(isoDate: string, hhmm: string, _timezone: string): Date | null {
  // NOTE: expo-notifications schedules against device wall-clock. For the
  // skeleton we compose the date in device local time. A future improvement
  // is to compute the true instant using the mosque timezone and pass
  // `date` (absolute) triggers.
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(isoDate);
  d.setHours(h, m, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Cancels prior reminders for the given mosque/date range and reschedules
 * based on the calendar + subscription toggles. Idempotent for identical
 * input (Requirement 11.5).
 */
export async function rescheduleForMosque(
  mosque: Mosque,
  subscription: Subscription,
  calendars: MosqueCalendar[],
): Promise<void> {
  const now = Date.now();

  // Cancel prior reminders belonging to this mosque.
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    existing
      .filter((n) => n.content.data?.mosqueId === mosque.id)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  const tone = getTone(subscription.toneOverride);

  for (const cal of calendars) {
    if (cal.empty) continue;
    for (const slot of slotsFor(cal, subscription)) {
      if (!slot.enabled || !slot.azan) continue;
      const when = localTriggerDate(cal.date, slot.azan, mosque.timezone);
      if (!when || when.getTime() <= now) continue;

      const prayerLabel = i18n.t(`prayers.${slot.key === 'zuhr' && cal.jumuahAzan ? 'jumuah' : slot.key}`);

      await Notifications.scheduleNotificationAsync({
        identifier: tagFor(mosque.id, cal.date, slot.key),
        content: {
          title: `${mosque.name} · ${prayerLabel}`,
          body: `${i18n.t('prayers.azan')}: ${slot.azan}`,
          sound: tone.sound ?? undefined,
          data: { mosqueId: mosque.id, date: cal.date, prayer: slot.key },
        },
        trigger: when,
      });
    }
  }
}

export async function cancelAllForMosque(mosqueId: string): Promise<void> {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    existing
      .filter((n) => n.content.data?.mosqueId === mosqueId)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}
