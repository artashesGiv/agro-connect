import { triggerPostAiProcessing } from '@/services/ai';
import { createPostWithMedia } from '@/services/posts';

import { emitPostSent, emitQueueChanged } from './events';
import { deletePersistedPhoto } from './pendingMedia';
import { listPendingPosts, removePendingPost, type PendingPost } from './postQueue';

let processing = false;

/**
 * Пытается отправить все посты из очереди по порядку. Только сеть — единственная
 * причина, по которой мы автоматически оставляем пост в очереди и пробуем ещё раз
 * (на следующем восстановлении сети / запуске приложения / ручном «Отправить
 * сейчас»); любая другая ошибка просто показывается через `onError` — без
 * отдельного состояния «ошибка», без бэкоффа (см. историю решения в SPEC.md).
 */
export async function processPendingPosts(
  onError?: (post: PendingPost, message: string) => void,
): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    const items = await listPendingPosts();
    for (const item of items) {
      try {
        const createdPostId = await createPostWithMedia(item.authorId, item.input, item.photos);
        for (const photo of item.photos) deletePersistedPhoto(photo.uri);
        await removePendingPost(item.id);
        // Тот же вызов, что в обычном (онлайн) пути создания поста — иначе
        // пост с `@ai` в тексте, отправленный из очереди, никогда не получит
        // ответа: раньше это никак не вызывалось для отложенных постов.
        void triggerPostAiProcessing(createdPostId);
        // Реальный пост опубликован — ленты (`useFeed`/`useUserPosts`) должны
        // перечитаться сами, без ручного pull-to-refresh.
        emitPostSent();
      } catch (cause) {
        if (isNetworkError(cause)) {
          // Сети всё ещё нет — остальные попытки в этом проходе тоже не пройдут.
          break;
        }
        onError?.(item, cause instanceof Error ? cause.message : 'Не удалось отправить пост.');
      }
    }
  } finally {
    processing = false;
    emitQueueChanged();
  }
}

/** Также используется в `CreatePreviewScreen`, чтобы решить: очередь или обычная ошибка. */
export function isNetworkError(cause: unknown): boolean {
  if (cause instanceof TypeError) return true; // типичный fetch-сбой в RN/Hermes
  if (cause instanceof Error && /network/i.test(cause.message)) return true;
  return false;
}
