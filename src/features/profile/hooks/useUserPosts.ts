import { useEffect, useState } from 'react';

import { postsApi, type Post } from '../../../services/posts';

/**
 * Загружает посты пользователя при заходе на профиль. Пока `postsApi` делает
 * фейковый запрос и отдаёт моки. Ошибки логируются, список остаётся пустым.
 */
export function useUserPosts(userId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    postsApi
      .fetchUserPosts(userId)
      .then((data) => {
        if (active) setPosts(data);
      })
      .catch((error) => {
        if (active) console.error('Не удалось загрузить посты:', error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return { posts, loading };
}
