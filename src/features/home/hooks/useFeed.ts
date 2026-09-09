import { useCallback, useEffect, useState } from 'react';

import { getFeed, type FeedFilter, type FeedPost } from '@/services/posts';
import { toUserMessage } from '@/services/supabase';

type UseFeedResult = {
  posts: FeedPost[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

/** Тот же тонкий паттерн, что и useFields: загрузка при монтировании + reload. */
export function useFeed(filter: FeedFilter = {}): UseFeedResult {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Фильтр приходит объектом-литералом, поэтому в зависимости кладём его поля,
  // а не сам объект — иначе эффект перезапускался бы на каждый рендер.
  const { cropId, fieldId, postTypeCode, authorId, limit, before } = filter;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPosts(
        await getFeed({ cropId, fieldId, postTypeCode, authorId, limit, before }),
      );
    } catch (cause) {
      setError(toUserMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [cropId, fieldId, postTypeCode, authorId, limit, before]);

  useEffect(() => {
    void load();
  }, [load]);

  return { posts, loading, error, reload: load };
}
