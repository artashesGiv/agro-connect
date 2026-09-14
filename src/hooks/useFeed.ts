import { useCallback, useEffect, useState } from 'react';

import { readCache, writeCache } from '@/services/cache';
import { useAuth } from '@/services/auth';
import { getFeed, getPost, type FeedPost } from '@/services/posts';
import { subscribePostSent } from '@/services/postQueue';
import { summarizeReactions, type ReactionSummary } from '@/services/reactions';
import {
  dictionaries,
  storage,
  toUserMessage,
  type ReactionType,
} from '@/services/supabase';

import { useNetworkStatus } from './useNetworkStatus';

/** Отдельная от `toUserMessage` — это не ошибка сервера, а известное заранее состояние. */
const OFFLINE_MESSAGE = 'Нет подключения.';

/** Страница по 15 постов; keyset-курсор — `{ createdAt, id }` последнего. */
const PAGE = 15;

/** Пост ленты — как `ProfilePost`, плюс `isMine` и `createdAt` (курсор). */
export type FeedItem = {
  id: string;
  postTypeCode: string;
  createdAt: string;
  isMine: boolean;
  fieldId: string | null;
  author: { id: string; nickname: string; avatarUrl?: string; reputation: number };
  title: string;
  description?: string;
  images: string[];
  reactions: ReactionSummary[];
  commentCount: number;
};

type Cursor = { createdAt: string; id: string } | undefined;

/**
 * Кэшируем только «чистую» ленту — без поиска/фильтра по культуре/полю. Так
 * читают Home и Questions в обычном режиме; для произвольной комбинации
 * фильтров кэш только вводил бы в заблуждение (показал бы данные не по тому
 * запросу). Ключ — по `postTypeCode`, чтобы Home и Questions не путали кэши.
 */
const feedCacheKey = (postTypeCode?: string) => `feed:${postTypeCode ?? 'all'}`;

function mapItem(
  post: FeedPost,
  urls: Record<string, string>,
  activeTypes: ReactionType[],
  viewerId: string | undefined,
): FeedItem {
  return {
    id: post.id,
    postTypeCode: post.post_types?.code ?? 'field_update',
    createdAt: post.created_at,
    isMine: viewerId ? post.profiles?.id === viewerId : false,
    fieldId: post.field_id,
    author: {
      id: post.profiles?.id ?? '',
      nickname: post.profiles?.name ?? 'без имени',
      avatarUrl: post.profiles?.avatar_path
        ? storage.getAvatarUrl(post.profiles.avatar_path)
        : undefined,
      reputation: post.profiles?.reputation ?? 0,
    },
    title: post.title ?? 'Без заголовка',
    description: post.body ?? undefined,
    images: [...post.post_media]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((media) => urls[media.storage_path])
      .filter((url): url is string => Boolean(url)),
    reactions: summarizeReactions(post.post_reactions ?? [], activeTypes, viewerId),
    commentCount: (post.answers?.[0]?.count ?? 0) + (post.post_comments?.[0]?.count ?? 0),
  };
}

export type FeedFilter = {
  cropIds?: number[];
  search?: string;
  /** Код из `post_types` (`field_update` / `question`) — какой тип постов грузить. */
  postTypeCode?: string;
  /** Только посты, привязанные к этому полю (экран «Связанные посты»). */
  fieldId?: string;
};

/**
 * Бесконечная лента постов — общая для «Главной» (посты) и «Вопросов»
 * (фильтр по `postTypeCode: 'question'`). Страницы аккумулируются; подгрузка —
 * keyset по `(created_at, id)`. `setItems` наружу — для оптимистичных реакций
 * и вырезания поста при удалении (как `setPosts` в `useUserPosts`).
 *
 * `filter` (тип/культура/поиск) меняет тождество `fetchPage`, а значит и
 * `loadFirst` — существующий эффект ниже перезапускает загрузку с нуля сам,
 * без отдельного сброса курсора.
 */
export function useFeed(filter: FeedFilter = {}) {
  const { user } = useAuth();
  const viewerId = user?.id;
  const isOnline = useNetworkStatus();
  const { cropIds, search, postTypeCode, fieldId } = filter;

  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(
    async (cursor: Cursor): Promise<FeedItem[]> => {
      const [feed, activeTypes] = await Promise.all([
        getFeed({ limit: PAGE, before: cursor, cropIds, search, postTypeCode, fieldId }),
        dictionaries.getActiveReactionTypes(),
      ]);
      const paths = feed.flatMap((post) =>
        post.post_media.map((media) => media.storage_path),
      );
      const urls = await storage.getPostMediaUrls(paths);
      return feed.map((post) => mapItem(post, urls, activeTypes, viewerId));
    },
    [viewerId, cropIds, search, postTypeCode, fieldId],
  );

  const cacheable = !search && !cropIds?.length && !fieldId;

  /**
   * Первая страница с фолбэком в кэш при ошибке (в первую очередь — без сети).
   * `fromCache: true` значит «дальше страниц нет» — подгрузка офлайн всё равно
   * не сработает, а с `hasMore: true` список рисовал бы бесконечный футер.
   *
   * Если `useNetworkStatus` уже знает, что сети нет, запрос вообще не уходит:
   * при «подключены к Wi-Fi без интернета» голый `fetch` может виснуть на
   * TCP-таймаут в десятки секунд вместо мгновенной ошибки — NetInfo это
   * состояние уже определил, ждать реального сбоя запроса незачем.
   */
  const loadPage = useCallback(async (): Promise<{
    page: FeedItem[];
    fromCache: boolean;
  }> => {
    if (!isOnline) {
      if (cacheable) {
        const cached = await readCache<FeedItem[]>(feedCacheKey(postTypeCode));
        if (cached) return { page: cached, fromCache: true };
      }
      throw new Error(OFFLINE_MESSAGE);
    }
    try {
      const page = await fetchPage(undefined);
      if (cacheable) void writeCache(feedCacheKey(postTypeCode), page);
      return { page, fromCache: false };
    } catch (cause) {
      if (cacheable) {
        const cached = await readCache<FeedItem[]>(feedCacheKey(postTypeCode));
        if (cached) return { page: cached, fromCache: true };
      }
      throw cause;
    }
  }, [fetchPage, cacheable, postTypeCode, isOnline]);

  const loadFirst = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { page, fromCache } = await loadPage();
      setItems(page);
      setHasMore(!fromCache && page.length === PAGE);
    } catch (cause) {
      setError(toUserMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [loadPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const { page, fromCache } = await loadPage();
      setItems(page);
      setHasMore(!fromCache && page.length === PAGE);
    } catch (cause) {
      setError(toUserMessage(cause));
    } finally {
      setRefreshing(false);
    }
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || refreshing || !hasMore || items.length === 0) return;
    if (!isOnline) {
      setError(OFFLINE_MESSAGE);
      return;
    }
    setLoadingMore(true);
    try {
      const last = items[items.length - 1];
      const page = await fetchPage({ createdAt: last.createdAt, id: last.id });
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        return [...prev, ...page.filter((item) => !seen.has(item.id))];
      });
      setHasMore(page.length === PAGE);
    } catch (cause) {
      setError(toUserMessage(cause));
    } finally {
      setLoadingMore(false);
    }
  }, [items, loadingMore, loading, refreshing, hasMore, fetchPage, isOnline]);

  /**
   * Перечитать один пост (после возврата с PostDetail / EditPost): свежие
   * счётчик комментариев, реакции, изменённые поля. Скролл и подгруженные
   * страницы не трогаются. Если пост исчез — убираем из ленты.
   */
  const syncItem = useCallback(
    async (id: string) => {
      if (!isOnline) return;
      try {
        const post = await getPost(id);
        if (!post) {
          setItems((prev) => prev.filter((item) => item.id !== id));
          return;
        }
        const activeTypes = await dictionaries.getActiveReactionTypes();
        const urls = await storage.getPostMediaUrls(
          post.post_media.map((media) => media.storage_path),
        );
        const fresh = mapItem(post, urls, activeTypes, viewerId);
        setItems((prev) => prev.map((item) => (item.id === id ? fresh : item)));
      } catch {
        // Тихо: не смогли обновить один пост — не повод рушить ленту.
      }
    },
    [viewerId, isOnline],
  );

  useEffect(() => {
    void loadFirst();
  }, [loadFirst]);

  // Пост из офлайн-очереди отправился в фоне (см. `processPendingPosts`) —
  // перечитываем ленту сами, без ручного pull-to-refresh.
  useEffect(() => subscribePostSent(() => void refresh()), [refresh]);

  return {
    items,
    setItems,
    loading,
    loadingMore,
    refreshing,
    error,
    syncItem,
    hasMore,
    loadMore,
    refresh,
    retry: loadFirst,
  };
}
