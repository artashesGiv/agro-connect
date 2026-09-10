import { useCallback, useRef, useState } from 'react';

import { toUserMessage } from '@/services/supabase';

import { getFields, type Field } from '../repository/fieldsRepository';

type UseFieldsResult = {
  fields: Field[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

/**
 * Тонкая обёртка над репозиторием. Сама при монтировании не грузит: экран
 * вызывает `reload` при каждом появлении вкладки, и автозагрузка означала бы
 * два одинаковых запроса подряд.
 *
 * Кэша нет намеренно — когда он понадобится, сюда встанет react-query,
 * и экраны менять не придётся.
 */
export function useFields(): UseFieldsResult {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Отсекает ответ предыдущей загрузки, если началась новая. */
  const runIdRef = useRef(0);

  const reload = useCallback(async () => {
    const runId = ++runIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await getFields();
      if (runIdRef.current === runId) setFields(data);
    } catch (cause) {
      if (runIdRef.current === runId) setError(toUserMessage(cause));
    } finally {
      if (runIdRef.current === runId) setLoading(false);
    }
  }, []);

  return { fields, loading, error, reload };
}
