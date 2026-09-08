import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { useAppTheme } from '../theme';

/** Имя иконки из набора MaterialCommunityIcons (TS подсказывает и проверяет). */
export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type IconProps = {
  name: IconName;
  size?: number;
  /** По умолчанию — `theme.colors.onSurface`. */
  color?: string;
  style?: StyleProp<TextStyle>;
};

/**
 * Единая точка для иконок приложения. Набор — MaterialCommunityIcons
 * (тот же, что использует React Native Paper). Как добавлять новые — см.
 * раздел «Icons» в CLAUDE.md.
 */
export function Icon({ name, size = 24, color, style }: IconProps) {
  const theme = useAppTheme();
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color ?? theme.colors.onSurface}
      style={style}
    />
  );
}
