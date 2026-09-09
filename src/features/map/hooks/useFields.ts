import { useCallback, useEffect, useState } from 'react';

import { toUserMessage } from '@/services/supabase';

import { getFields, type Field } from '../repository/fieldsRepository';

type UseFieldsResult = {
  fields: Field[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

/**
 * Тонкая обёртка над репозиторием: загрузка при монтировании + ручной reload.
 * Кэша нет намеренно — когда он понадобится, сюда встанет react-query,
 * и экраны менять не придётся.
 */
export function useFields(): UseFieldsResult {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFields(await getFields());
    } catch (cause) {
      setError(toUserMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getFields()
      .then((data) => {
        if (active) setFields(data);
      })
      .catch((cause) => {
        if (active) setError(toUserMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { fields, loading, error, reload: load };
}
