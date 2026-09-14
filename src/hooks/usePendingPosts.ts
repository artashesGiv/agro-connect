import { useCallback, useEffect, useState } from 'react';

import {
  listPendingPosts,
  processPendingPosts,
  removePendingPost,
  subscribeQueueChanged,
  type PendingPost,
} from '@/services/postQueue';
import { useAuth } from '@/services/auth';

import { useNetworkStatus } from './useNetworkStatus';

/**
 * Посты, отложенные из-за отсутствия сети (см. `CreatePreviewScreen`). Пробует
 * отправить очередь при монтировании и при каждом восстановлении сети; экран
 * (профиль) дополнительно даёт кнопку «Отправить сейчас» для ручного повтора.
 */
export function usePendingPosts() {
  const { user } = useAuth();
  const userId = user?.id;
  const isOnline = useNetworkStatus();
  const [items, setItems] = useState<PendingPost[]>([]);
  const [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setItems(await listPendingPosts(userId));
  }, [userId]);

  useEffect(() => {
    void reload();
    return subscribeQueueChanged(() => void reload());
  }, [reload]);

  const runQueue = useCallback(async () => {
    setProcessing(true);
    try {
      await processPendingPosts((_post, message) => setNotice(message));
    } finally {
      setProcessing(false);
    }
  }, []);

  // При монтировании (открыт профиль) и при каждом восстановлении сети.
  useEffect(() => {
    void runQueue();
  }, [isOnline, runQueue]);

  const remove = useCallback(async (id: string) => {
    await removePendingPost(id);
  }, []);

  return { items, processing, retryAll: runQueue, remove, notice, clearNotice: () => setNotice(null) };
}
