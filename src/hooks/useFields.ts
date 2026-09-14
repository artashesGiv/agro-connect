import { useCallback, useRef, useState } from 'react';

import { readCache, writeCache } from '@/services/cache';
import { useAuth } from '@/services/auth';
import { toUserMessage } from '@/services/supabase';

import { getFields, type Field } from '@/services/fields';
import { useNetworkStatus } from './useNetworkStatus';

type UseFieldsResult = {
  fields: Field[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const cacheKey = (userId: string) => `fields:${userId}`;

/**
 * Тонкая обёртка над сервисом полей. Живёт в общих хуках, а не в фиче карты:
 * тот же список нужен и вкладке профиля. Сама при монтировании не грузит: экран
 * вызывает `reload` при каждом появлении вкладки, и автозагрузка означала бы
 * два одинаковых запроса подряд.
 *
 * Кэш — последний успешный список в AsyncStorage (по id зрителя, не «своих»
 * полей: `getFields` отдаёт вообще все видимые поля). Если `useNetworkStatus`
 * уже знает, что сети нет, запрос вообще не уходит — сразу отдаём кэш: при
 * «подключены к Wi-Fi без интернета» голый `fetch` может виснуть на TCP-таймаут
 * (десятки секунд), а NetInfo это состояние уже определил. При обычной ошибке
 * запроса (например, сеть пропала уже во время загрузки) — тот же фолбэк в
 * `catch`. Ошибку показываем только если кэша тоже нет.
 */
export function useFields(): UseFieldsResult {
  const { user } = useAuth();
  const userId = user?.id;
  const isOnline = useNetworkStatus();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Отсекает ответ предыдущей загрузки, если началась новая. */
  const runIdRef = useRef(0);

  const loadCached = useCallback(async (): Promise<Field[] | null> => {
    return userId ? await readCache<Field[]>(cacheKey(userId)) : null;
  }, [userId]);

  const reload = useCallback(async () => {
    const runId = ++runIdRef.current;
    setLoading(true);
    setError(null);

    if (!isOnline) {
      const cached = await loadCached();
      if (runIdRef.current !== runId) return;
      if (cached) setFields(cached);
      else setError('Нет подключения. Список полей не загружен.');
      setLoading(false);
      return;
    }

    try {
      const data = await getFields();
      if (runIdRef.current !== runId) return;
      setFields(data);
      if (userId) void writeCache(cacheKey(userId), data);
    } catch (cause) {
      if (runIdRef.current !== runId) return;
      const cached = await loadCached();
      if (cached) {
        setFields(cached);
      } else {
        setError(toUserMessage(cause));
      }
    } finally {
      if (runIdRef.current === runId) setLoading(false);
    }
  }, [userId, isOnline, loadCached]);

  return { fields, loading, error, reload };
}
