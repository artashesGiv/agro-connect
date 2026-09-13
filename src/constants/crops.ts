import type { IconName } from '@/components/Icon';

/**
 * Цвет и иконка на карте для основной культуры поля (`fields.current_crop.slug`
 * — денормализованный JSONB, не `crop_id`/связь, см. `src/services/fields`).
 * Чисто фронтовое решение, бэк цвета/иконки не хранит.
 *
 * `icon` — имя из того же набора MaterialCommunityIcons, что использует
 * `Icon.tsx` (`@expo/vector-icons`), поэтому тип переиспользован для проверки
 * опечаток на этапе сборки. Карта рисует его не через компонент, а веб-шрифтом
 * `@mdi/font` (грузится в `mapHtml.ts`) — тот же набор глифов под именем MDI,
 * доступный внутри WebView как CSS-класс `mdi-<name>`.
 */
export type CropStyle = {
  /** Непрозрачный опорный цвет; альфу для заливки/приглушения чужих полей считает вызывающий код. */
  color: string;
  icon: IconName;
};

/** По `slug` из справочника `crops` (10 культур, см. `dictionaries.getCrops`). */
export const CROP_STYLES: Record<string, CropStyle> = {
  wheat: { color: '#D9A441', icon: 'barley' },
  barley: { color: '#C7B37A', icon: 'barley' },
  corn: { color: '#F5C518', icon: 'corn' },
  sunflower: { color: '#F2A900', icon: 'flower' },
  rapeseed: { color: '#D4C71C', icon: 'flower-outline' },
  soybean: { color: '#7CB342', icon: 'sprout' },
  rye: { color: '#A98358', icon: 'barley' },
  oats: { color: '#C9BC8B', icon: 'grass' },
  sugar_beet: { color: '#A83250', icon: 'carrot' },
  buckwheat: { color: '#8D6E63', icon: 'seed-outline' },
};

export function getCropStyle(slug: string | undefined | null): CropStyle | null {
  if (!slug) return null;
  return CROP_STYLES[slug] ?? null;
}
