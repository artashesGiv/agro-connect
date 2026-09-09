import { useCallback, useEffect, useState } from 'react';

import { getFeed } from '@/services/posts';
import { storage, toUserMessage } from '@/services/supabase';

/** Пост в том виде, в каком его рисует `PostCard` на экране профиля. */
export type ProfilePost = {
  id: string;
  author: { nickname: string; avatarUrl?: string };
  title: string;
  description?: string;
  images: string[];
};

/**
 * Посты автора для вкладки «Мои посты» (и позже — чужого профиля). Тянет ленту
 * с фильтром по `author_id` и подписывает URL для приватного бакета `post-media`.
 * `reload` зовётся из экрана при фокусе — чтобы свежесозданный пост появился.
 */
export function useUserPosts(userId?: string) {
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const feed = await getFeed({ authorId: userId, limit: 30 });
      const paths = feed.flatMap((post) =>
        post.post_media.map((media) => media.storage_path),
      );
      const urls = await storage.getPostMediaUrls(paths);

      const mapped: ProfilePost[] = feed.map((post) => ({
        id: post.id,
        author: {
          nickname: post.profiles?.name ?? 'без имени',
          avatarUrl: post.profiles?.avatar_path
            ? storage.getAvatarUrl(post.profiles.avatar_path)
            : undefined,
        },
        title: post.title ?? 'Без заголовка',
        description: post.body ?? undefined,
        images: [...post.post_media]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((media) => urls[media.storage_path])
          .filter((url): url is string => Boolean(url)),
      }));

      setPosts(mapped);
    } catch (cause) {
      setError(toUserMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { posts, loading, error, reload: load };
}
