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
 * Без таймаута зависший `fetch` (спящий проект, обрыв сети, прокси) вешает
 * экран на неопределённый срок — `useFeed`/репозитории умеют показать
 * ошибку, но только если промис вообще settled.
 */
const FETCH_TIMEOUT_MS = 15000;

function withTimeout(fetchImpl: typeof fetch): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      return await fetchImpl(input, { ...init, signal: init?.signal ?? controller.signal });
    } catch (cause) {
      if (controller.signal.aborted) {
        throw new Error(
          'Превышено время ожидания ответа сервера. Проверьте соединение и повторите.',
        );
      }
      throw cause;
    } finally {
      clearTimeout(timeoutId);
    }
  };
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
  global: {
    // TEMP: логируем каждый запрос — Network-таб DevTools недоступен под Expo Go.
    fetch: __DEV__
      ? async (input, init) => {
          const method = init?.method ?? 'GET';
          console.log('[supabase]', method, input);
          try {
            const response = await withTimeout(fetch)(input, init);
            const body = await response.clone().text();
            console.log('[supabase]', method, input, '->', response.status, body);
            return response;
          } catch (cause) {
            console.log(
              '[supabase]',
              method,
              input,
              '-> ERROR',
              cause instanceof Error ? cause.message : cause,
            );
            throw cause;
          }
        }
      : withTimeout(fetch),
  },
});
