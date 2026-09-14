import type { IconName } from '@/components/Icon';
import { logoAccents } from '@/theme';

export type OnboardingSlide =
  | { key: 'brand'; variant: 'brand' }
  | {
      key: string;
      variant: 'feature';
      icon: IconName;
      accent: string;
      title: string;
      description: string;
    }
  | { key: 'cta'; variant: 'cta' };

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  { key: 'brand', variant: 'brand' },
  {
    key: 'feed',
    variant: 'feature',
    icon: 'newspaper-variant-outline',
    accent: logoAccents.leaf,
    title: 'Лента с полей',
    description:
      'Публикуйте новости о состоянии посевов с фото и следите за обновлениями других хозяйств рядом.',
  },
  {
    key: 'ai',
    variant: 'feature',
    icon: 'robot-happy-outline',
    accent: logoAccents.sun,
    title: 'ИИ-помощник в ленте',
    description:
      'Добавьте @ai в текст поста — и ИИ-помощник ответит прямо в комментариях под записью в ленте.',
  },
  {
    key: 'questions',
    variant: 'feature',
    icon: 'help-circle-outline',
    accent: logoAccents.ribbon,
    title: 'Вопросы сообществу',
    description:
      'Спрашивайте совета у агрономов и фермеров, отвечайте на чужие вопросы и делитесь опытом.',
  },
  {
    key: 'map',
    variant: 'feature',
    icon: 'map-marker-radius-outline',
    accent: logoAccents.leafDark,
    title: 'Карта полей',
    description:
      'Отмечайте свои поля на карте, указывайте культуру и открывайте посты, привязанные к каждому полю.',
  },
  {
    key: 'create',
    variant: 'feature',
    icon: 'camera-plus-outline',
    accent: logoAccents.leaf,
    title: 'Публикация за 4 шага',
    description:
      'Тип поста, фото с камеры или галереи, привязка к полю — и запись готова к публикации.',
  },
  { key: 'cta', variant: 'cta' },
];
