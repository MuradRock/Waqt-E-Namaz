import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/auth/authStore';
import { tokenStore } from '../src/auth/tokenStore';
import { useState } from 'react';

/**
 * Entry route: redirects to auth or the main tab flow based on whether a
 * token exists. The auth store has already bootstrapped by this point.
 */
export default function Index() {
  const user = useAuthStore((s) => s.user);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => setHasToken(Boolean(await tokenStore.get())))();
  }, []);

  if (hasToken === null) return null;
  return <Redirect href={user || hasToken ? '/(tabs)/home' : '/auth'} />;
}
