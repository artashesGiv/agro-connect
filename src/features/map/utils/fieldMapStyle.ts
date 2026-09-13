import type { MD3Theme } from 'react-native-paper';

import { getCropStyle } from '@/constants/crops';
import type { Field } from '@/services/fields';

/** Полностью посчитанный стиль поля для карты — WebView просто применяет эти строки. */
export type FieldMapStyle = {
  fillColor: string;
  strokeColor: string;
  markerColor: string;
  markerBorderColor: string;
  /** MDI-имя глифа маркера без префикса `mdi-`; `null` — без иконки. */
  icon: string | null;
};

/** Заливка полупрозрачная: под полем должна оставаться видна карта. */
const OWN_FILL_ALPHA = 0x33 / 255;
/** Чужое поле — на 30% более блёклое, чем то же самое своё (не другой цвет). */
const FOREIGN_FADE = 0.7;

function alphaHex(fraction: number): string {
  const clamped = Math.max(0, Math.min(1, fraction));
  return Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
}

/**
 * Цвет/иконка поля на карте.
 *
 * Без основной культуры — как было до появления культур: своё поле красится
 * акцентным `primary`, чужое — нейтральным `outline`/`onSurface` (обычный
 * серый контур терялся на подложке карты, поэтому обводка чужого поля темнее
 * заливки).
 *
 * С основной культурой — и своё, и чужое поле красятся цветом культуры;
 * единственная разница чужого — непрозрачность заливки и обводки умножена на
 * `FOREIGN_FADE`, а не другой цвет: чтобы «то же самое, только блёклее»
 * читалось буквально.
 */
export function getFieldMapStyle(field: Field, mine: boolean, theme: MD3Theme): FieldMapStyle {
  const cropStyle = getCropStyle(field.current_crop?.slug);
  const markerBorderColor = mine ? theme.colors.onPrimary : theme.colors.onSurfaceVariant;

  if (cropStyle) {
    const base = cropStyle.color;
    const fillAlpha = mine ? OWN_FILL_ALPHA : OWN_FILL_ALPHA * FOREIGN_FADE;
    return {
      fillColor: base + alphaHex(fillAlpha),
      strokeColor: base + alphaHex(mine ? 1 : FOREIGN_FADE),
      markerColor: mine ? base : base + alphaHex(FOREIGN_FADE),
      markerBorderColor,
      icon: cropStyle.icon,
    };
  }

  if (mine) {
    return {
      fillColor: `${theme.colors.primary}${alphaHex(OWN_FILL_ALPHA)}`,
      strokeColor: theme.colors.primary,
      markerColor: theme.colors.primary,
      markerBorderColor,
      icon: null,
    };
  }

  return {
    fillColor: `${theme.colors.outline}${alphaHex(OWN_FILL_ALPHA)}`,
    strokeColor: theme.colors.onSurface,
    markerColor: theme.colors.outline,
    markerBorderColor,
    icon: null,
  };
}
