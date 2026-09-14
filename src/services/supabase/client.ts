import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database.types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Падаем сразу и с понятным текстом: иначе SDK уронит запрос где-то внутри
// с «Invalid URL», а в EAS-сборке без .env это вообще не диагностируется.
if (!url || !publishableKey) {
  throw new Error(
    'Не заданы EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
      'Скопируйте .env.example в .env и перезапустите dev-сервер.',
  );
}

/**
 * Единственный клиент приложения. Держит сессию в AsyncStorage, сам рефрешит
 * токен и подставляет JWT в каждый запрос — своего слоя с токеном больше нет.
 */
export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Deep link с токеном в приложении не разбираем — это про web.
    detectSessionInUrl: false,
  },
  // TEMP: логируем каждый запрос — Network-таб DevTools недоступен под Expo Go.
  global: __DEV__
    ? {
        fetch: async (input, init) => {
          const method = init?.method ?? 'GET';
          console.log('[supabase]', method, input);
          const response = await fetch(input, init);
          const body = await response.clone().text();
          console.log('[supabase]', method, input, '->', response.status, body);
          return response;
        },
      }
    : undefined,
});
