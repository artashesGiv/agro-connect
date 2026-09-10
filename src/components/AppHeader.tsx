import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Appbar, type MD3Theme } from 'react-native-paper';

import { useAppTheme } from '@/theme';

export type HeaderAction = {
  /** Имя иконки MaterialCommunityIcons. */
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
};

type Props = {
  title?: string;
  /** Кнопка «назад» слева. */
  onBack?: () => void;
  /** Иконка слева, когда «назад» не нужен (например колокольчик на профиле). */
  leading?: HeaderAction;
  /** Иконки справа. */
  actions?: HeaderAction[];
};

/**
 * Единая верхняя панель приложения. Один вид на всех экранах: плоская, заголовок
 * слева, хайрлайн снизу. Нативные хедеры навигации выключены — панель рендерит
 * сам экран. `Appbar.Header` добавляет верхнюю safe-area врезку.
 */
export function AppHeader({ title, onBack, leading, actions = [] }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Appbar.Header mode="small" elevated={false} style={styles.header}>
      {onBack ? (
        <Appbar.BackAction onPress={onBack} accessibilityLabel="Назад" />
      ) : leading ? (
        <Appbar.Action
          icon={leading.icon}
          onPress={leading.onPress}
          accessibilityLabel={leading.accessibilityLabel}
        />
      ) : null}

      <Appbar.Content title={title ?? ''} titleStyle={styles.title} />

      {actions.map((action) => (
        <Appbar.Action
          key={action.icon}
          icon={action.icon}
          onPress={action.onPress}
          accessibilityLabel={action.accessibilityLabel}
        />
      ))}
    </Appbar.Header>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    header: {
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
  });
