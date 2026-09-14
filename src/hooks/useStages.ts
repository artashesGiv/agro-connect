import { useEffect, useState } from 'react';

import { dictionaries, type PostStage } from '@/services/supabase';

/**
 * Список стадий для чипов-фильтра ленты. Используется «Главной» и «Вопросами».
 * «Проблема» скрыта — как и в пикерах выбора статуса, её нельзя ни поставить,
 * ни отфильтровать по ней заново.
 */
export function useStages() {
  const [stages, setStages] = useState<PostStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    dictionaries
      .getPostStages()
      .then((list) => {
        if (active) setStages(list.filter((stage) => stage.code !== 'problem'));
      })
      .catch(() => {
        // Список стадий не критичен — лента работает и без чипов-фильтра.
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { stages, loading };
}
