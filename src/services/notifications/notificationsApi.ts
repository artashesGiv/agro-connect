import { supabase } from '@/services/supabase';
import type { Tables } from '@/types/database.types';

export type NotificationRow = Tables<'notifications'>;

/** Значения `type`, реально генерируемые бэкендом — см. `NOTIFICATIONS_FRONTEND.md`, п.5/7. */
export type NotificationType =
  | 'answer_created'
  | 'answer_reply'
  | 'ai_reply_ready'
  | 'ai_reply_failed'
  | 'weather_alert'
  | 'reputation_star_up'
  | 'post_reaction'
  | 'answer_vote'
  | 'system';

/** Строк достаточно много, чтобы пагинация не понадобилась — поллинг раз в 5с и так держит список свежим. */
const LIMIT = 50;

export async function getNotifications(): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(LIMIT);
  if (error) throw error;
  return data;
}

/**
 * Единственное поле, которое разрешают менять column grants (см. документ,
 * раздел 6) — попытка отправить что-то ещё будет отклонена RLS.
 */
export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
