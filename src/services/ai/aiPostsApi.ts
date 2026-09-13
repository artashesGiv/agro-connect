import { supabase } from '@/services/supabase';

/**
 * Просит бэкенд обработать пост ИИ-помощником (Edge Function сама проверяет
 * `@ai` в тексте и решает, нужен ли ответ). Fire-and-forget: пост к этому
 * моменту уже успешно создан/сохранён, поэтому сбой здесь не должен мешать
 * пользователю — бэкенд также защищён от повторных запусков на один пост.
 */
export async function triggerPostAiProcessing(postId: string): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('process-ai-post', {
      body: { post_id: postId },
    });
    // TODO(temp-debug): убрать после подтверждения схемы бэкендом (SPEC.md, п.7).
    console.warn('[ai] process-ai-post response', { postId, data, error });
  } catch (cause) {
    // TODO(temp-debug): убрать после подтверждения схемы бэкендом (SPEC.md, п.7).
    console.warn('[ai] process-ai-post threw', { postId, cause });
  }
}
