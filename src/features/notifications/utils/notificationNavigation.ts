import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { AppStackParamList } from '@/navigation/types';
import type { NotificationRow } from '@/services/notifications';

/** `data` приходит как `Json` — читаем защитно, поля могут отсутствовать/быть не той формы. */
function readData(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

/**
 * Тап по конкретному уведомлению → соответствующий пост/поле/профиль.
 * `post_reaction`/`answer_vote`/`system`/неизвестный тип — реально бэкендом
 * пока не генерируются (см. `NOTIFICATIONS_FRONTEND.md`, п.7); остаёмся на
 * экране уведомлений. Удалённые пост/поле — уже штатно обрабатывают сами
 * `PostDetailScreen`/`MapScreen`, отдельной защиты здесь не нужно.
 */
export function openNotification(
  notification: NotificationRow,
  navigation: NativeStackNavigationProp<AppStackParamList, keyof AppStackParamList>,
): void {
  const data = readData(notification.data);

  switch (notification.type) {
    case 'answer_created':
    case 'answer_reply':
    case 'ai_reply_ready':
    case 'ai_reply_failed': {
      if (typeof data.post_id === 'string') {
        navigation.navigate('PostDetail', { postId: data.post_id });
      }
      return;
    }
    case 'weather_alert': {
      if (typeof data.field_id === 'string') {
        navigation.navigate('Tabs', {
          screen: 'Map',
          params: { focusFieldId: data.field_id, openCard: true },
        });
      }
      return;
    }
    case 'reputation_star_up': {
      navigation.navigate('Tabs', { screen: 'Profile' });
      return;
    }
    default:
      return;
  }
}
