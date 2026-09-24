import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config';
import { tokenStore } from '../auth/tokenStore';

/**
 * Shared Axios instance. Attaches the bearer token on every request and
 * clears it (forcing re-login) when the API returns 401.
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStore.get();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err?.response?.status === 401) {
      await tokenStore.clear();
    }
    return Promise.reject(err);
  },
);

/** Structured API error thrown by resource modules. */
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    const body = err.response?.data as { error?: { code?: string; message?: string; details?: unknown } } | undefined;
    return new ApiError(
      status,
      body?.error?.code ?? 'NETWORK_ERROR',
      body?.error?.message ?? err.message,
      body?.error?.details,
    );
  }
  return new ApiError(0, 'UNKNOWN', (err as Error)?.message ?? 'Unknown error');
}
