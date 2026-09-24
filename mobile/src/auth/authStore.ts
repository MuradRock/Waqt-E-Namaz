import { create } from 'zustand';
import { api, toApiError } from '../api/client';
import { tokenStore } from './tokenStore';

export type Language = 'EN' | 'HI' | 'UR';

export interface User {
  id: string;
  email: string;
  displayName: string;
  language: Language;
}

interface AuthState {
  user: User | null;
  bootstrapping: boolean;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  bootstrapping: true,

  async bootstrap() {
    const token = await tokenStore.get();
    if (!token) return set({ bootstrapping: false });
    try {
      // No /me endpoint yet; rely on the token and defer user hydration.
      set({ bootstrapping: false, user: null });
    } catch {
      await tokenStore.clear();
      set({ bootstrapping: false, user: null });
    }
  },

  async login(email, password) {
    try {
      const { data } = await api.post<{ user: User; token: string }>('/auth/login', { email, password });
      await tokenStore.set(data.token);
      set({ user: data.user });
    } catch (e) { throw toApiError(e); }
  },

  async register(email, password, displayName) {
    try {
      const { data } = await api.post<{ user: User; token: string }>('/auth/register', {
        email, password, displayName,
      });
      await tokenStore.set(data.token);
      set({ user: data.user });
    } catch (e) { throw toApiError(e); }
  },

  async logout() {
    await tokenStore.clear();
    set({ user: null });
  },
}));
