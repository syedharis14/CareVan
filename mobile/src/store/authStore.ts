import { AuthUser } from '@carevan/shared';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { ApiError, setTokenProvider } from '../api/client';
import { authApi, meApi } from '../api/endpoints';
import { stopTracking } from '../location/locationTask';
import { registerForPushToken } from '../notifications/push';

const TOKEN_KEY = 'carevan_token';
const USER_KEY = 'carevan_user';

type AuthStatus = 'loading' | 'anon' | 'authed';

interface AuthState {
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (phone: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'loading',
  token: null,
  user: null,
  error: null,

  hydrate: async () => {
    try {
      const [token, userJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);
      if (token && userJson) {
        set({ token, user: JSON.parse(userJson) as AuthUser, status: 'authed' });
        // Best-effort token refresh registration once we're back online.
        void syncPushToken();
      } else {
        set({ status: 'anon' });
      }
    } catch {
      set({ status: 'anon' });
    }
  },

  login: async (phone, pin) => {
    set({ error: null });
    try {
      const res = await authApi.login(phone, pin);
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, res.accessToken),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(res.user)),
      ]);
      set({ token: res.accessToken, user: res.user, status: 'authed', error: null });
      void syncPushToken();
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : 'Could not sign in. Check your connection.';
      set({ error: message });
      throw e;
    }
  },

  logout: async () => {
    await stopTracking().catch(() => undefined);
    await meApi.clearPushToken().catch(() => undefined);
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    set({ token: null, user: null, status: 'anon', error: null });
  },
}));

// The api client reads the live token from the store on every request.
setTokenProvider(() => useAuthStore.getState().token);

async function syncPushToken(): Promise<void> {
  try {
    const token = await registerForPushToken();
    if (token) await meApi.registerPushToken(token);
  } catch {
    // Non-fatal — the parent app reconciles on open; retried next login/launch.
  }
}
