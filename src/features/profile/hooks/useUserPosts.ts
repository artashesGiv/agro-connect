import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/services/auth';
import { getFeed } from '@/services/posts';
import { summarizeReactions, type ReactionSummary } from '@/services/reactions';
import { dictionaries, storage, toUserMessage } from '@/services/supabase';

export type { ReactionSummary };

/** Пост в том виде, в каком его рисует `PostCard` на экране профиля. */
export type ProfilePost = {
  id: string;
  /** `code` из справочника post_types — нужен экрану редактирования. */
  postTypeCode: string;
  author: { nickname: string; avatarUrl?: string };
  title: string;
  description?: string;
  images: string[];
  /** По одному элементу на активный тип реакции, в порядке справочника. */
  reactions: ReactionSummary[];
  commentCount: number;
};

/**
 * Посты автора для вкладки «Мои посты» (и позже — чужого профиля). Тянет ленту
 * с фильтром по `author_id`, подписывает URL для приватного бакета `post-media`
 * и сводит реакции/комментарии к счётчикам.
 * `reload` зовётся из экрана при фокусе — чтобы свежесозданный пост появился.
 */
export function useUserPosts(userId?: string) {
  const { user } = useAuth();
  const viewerId = user?.id;
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
      const [feed, activeTypes] = await Promise.all([
        getFeed({ authorId: userId, limit: 30 }),
        dictionaries.getActiveReactionTypes(),
      ]);
      const paths = feed.flatMap((post) =>
        post.post_media.map((media) => media.storage_path),
      );
      const urls = await storage.getPostMediaUrls(paths);

      const mapped: ProfilePost[] = feed.map((post) => ({
        id: post.id,
        postTypeCode: post.post_types?.code ?? 'field_update',
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
        reactions: summarizeReactions(post.post_reactions ?? [], activeTypes, viewerId),
        commentCount: post.answers?.[0]?.count ?? 0,
      }));

      setPosts(mapped);
    } catch (cause) {
      setError(toUserMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [userId, viewerId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { posts, setPosts, loading, error, reload: load };
}
