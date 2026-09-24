import { api, toApiError } from './client';

export interface Mosque {
  id: string;
  name: string;
  streetAddress: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  distanceKm?: number;
}

export interface MosqueCalendar {
  id: string;
  mosqueId: string;
  date: string;
  fajrAzan: string | null;    fajrNamaz: string | null;
  zuhrAzan: string | null;    zuhrNamaz: string | null;
  asrAzan: string | null;     asrNamaz: string | null;
  maghribAzan: string | null; maghribNamaz: string | null;
  ishaAzan: string | null;    ishaNamaz: string | null;
  jumuahAzan: string | null;  jumuahNamaz: string | null;
  suhoor: string | null;      iftar: string | null;
  updatedAt: string;
  empty?: boolean;
}

export async function searchNearby(latitude: number, longitude: number, radiusKm = 5): Promise<Mosque[]> {
  try {
    const { data } = await api.get<{ items: Mosque[] }>('/search/nearby', {
      params: { latitude, longitude, radiusKm },
    });
    return data.items;
  } catch (e) { throw toApiError(e); }
}

export async function searchText(q: string): Promise<Mosque[]> {
  try {
    const { data } = await api.get<{ items: Mosque[] }>('/search/text', { params: { q } });
    return data.items;
  } catch (e) { throw toApiError(e); }
}

export async function getMosque(id: string): Promise<Mosque> {
  try { const { data } = await api.get<Mosque>(`/mosques/${id}`); return data; }
  catch (e) { throw toApiError(e); }
}

export async function getCalendar(mosqueId: string, date: string, cachedTs?: number): Promise<{ calendar: MosqueCalendar | null; notModified: boolean; serverTs: number }> {
  try {
    const res = await api.get<MosqueCalendar>(`/mosques/${mosqueId}/calendars/${date}`, {
      headers: cachedTs ? { 'If-Modified-Since-Timestamp': String(cachedTs) } : undefined,
      validateStatus: (s) => s === 200 || s === 304,
    });
    if (res.status === 304) return { calendar: null, notModified: true, serverTs: cachedTs ?? 0 };
    const serverTs = Number(res.headers['x-updated-at'] ?? Date.parse(res.data.updatedAt ?? '')) || 0;
    return { calendar: res.data, notModified: false, serverTs };
  } catch (e) { throw toApiError(e); }
}
