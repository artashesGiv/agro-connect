import type { IconName } from '@/components/Icon';

export type NotificationType = 'comment' | 'reaction' | 'system';

export type MockNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

/** Иконка MaterialCommunityIcons на каждый тип уведомления. */
export const NOTIFICATION_ICONS: Record<NotificationType, IconName> = {
  comment: 'comment-outline',
  reaction: 'heart-outline',
  system: 'bullhorn-outline',
};

/**
 * Моковые данные — на бэке нет ни таблицы уведомлений, ни Realtime
 * (см. `api-docs/SUPABASE_CURRENT_SCHEMA.md`, раздел «Что пока не сделано»).
 * Типы опираются на реальные сущности приложения (посты, ответы, реакции),
 * но сами записи фиктивные и не тянутся с бэка.
 */
export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: '1',
    type: 'comment',
    title: 'Новый ответ на ваш пост',
    body: 'Иван Петров ответил: «А чем обрабатывали от фитофторы?»',
    createdAt: '2026-09-12T09:15:00.000Z',
    read: false,
  },
  {
    id: '2',
    type: 'reaction',
    title: 'Новая реакция',
    body: 'Кто-то оценил ваш пост «Урожай пшеницы 2026»',
    createdAt: '2026-09-12T07:40:00.000Z',
    read: false,
  },
  {
    id: '3',
    type: 'system',
    title: 'Добро пожаловать в AgroConnect',
    body: 'Заполните профиль и добавьте первое поле, чтобы начать.',
    createdAt: '2026-09-10T12:00:00.000Z',
    read: false,
  },
  {
    id: '4',
    type: 'comment',
    title: 'Новый комментарий',
    body: 'Мария Соколова: «Отличный результат для этого сезона!»',
    createdAt: '2026-09-09T18:22:00.000Z',
    read: true,
  },
  {
    id: '5',
    type: 'reaction',
    title: 'Новая реакция',
    body: 'Ваш ответ отметили как полезный',
    createdAt: '2026-09-08T14:05:00.000Z',
    read: true,
  },
  {
    id: '6',
    type: 'system',
    title: 'Совет дня',
    body: 'Не забудьте указать регион в профиле — так вас проще найти.',
    createdAt: '2026-09-05T10:00:00.000Z',
    read: true,
  },
];
