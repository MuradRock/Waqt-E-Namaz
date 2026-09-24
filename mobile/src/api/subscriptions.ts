import { api, toApiError } from './client';
import type { Mosque } from './mosques';

export interface Subscription {
  id: string;
  userId: string;
  mosqueId: string;
  fajrEnabled: boolean;
  zuhrEnabled: boolean;
  asrEnabled: boolean;
  maghribEnabled: boolean;
  ishaEnabled: boolean;
  toneOverride: string | null;
}

export interface SubscriptionWithMosque extends Subscription {
  mosque: Mosque;
}

export type PrayerKey = 'fajr' | 'zuhr' | 'asr' | 'maghrib' | 'isha';
export type PreferencePatch = Partial<Pick<Subscription, 'fajrEnabled' | 'zuhrEnabled' | 'asrEnabled' | 'maghribEnabled' | 'ishaEnabled' | 'toneOverride'>>;

export async function listSubscriptions(): Promise<SubscriptionWithMosque[]> {
  try { const { data } = await api.get<{ items: SubscriptionWithMosque[] }>('/subscriptions'); return data.items; }
  catch (e) { throw toApiError(e); }
}

export async function subscribe(mosqueId: string): Promise<Subscription> {
  try { const { data } = await api.post<Subscription>(`/subscriptions/${mosqueId}`); return data; }
  catch (e) { throw toApiError(e); }
}

export async function unsubscribe(mosqueId: string): Promise<void> {
  try { await api.delete(`/subscriptions/${mosqueId}`); }
  catch (e) { throw toApiError(e); }
}

export async function updatePreferences(mosqueId: string, patch: PreferencePatch): Promise<Subscription> {
  try { const { data } = await api.patch<Subscription>(`/subscriptions/${mosqueId}`, patch); return data; }
  catch (e) { throw toApiError(e); }
}
