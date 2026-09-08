import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'auth.accessToken';

/**
 * Постоянное хранилище токена (Keychain / Android Keystore).
 * Единственное, что переживает перезапуск приложения; читается только
 * при старте в `AuthProvider.bootstrap()`.
 */
export const tokenStorage = {
  async get(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  async set(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch {
      // молча — не блокируем вход, если хранилище недоступно
    }
  },
  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};
