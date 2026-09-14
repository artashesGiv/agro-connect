import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, type MD3Theme } from 'react-native-paper';

import { useAppTheme } from '@/theme';

export type HeaderAction = {
  /** Имя иконки MaterialCommunityIcons. */
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
  /** Маленькая красная точка в углу иконки — например, непрочитанные уведомления. */
  badge?: boolean;
};

type Props = {
  title?: string;
  /** Кнопка «назад» слева. */
  onBack?: () => void;
  /** Иконка слева, когда «назад» не нужен (например колокольчик на профиле). */
  leading?: HeaderAction;
  /** Иконки справа. */
  actions?: HeaderAction[];
  /** Заменяет заголовок произвольным содержимым (например, разворачивающимся
   *  полем поиска). Остальной хром хедера (leading/actions) не меняется. */
  titleSlot?: ReactNode;
  /** Заголовок по центру шапки — для экранов с симметричными leading/actions. */
  centerTitle?: boolean;
};

/**
 * Единая верхняя панель приложения. Один вид на всех экранах: плоская, заголовок
 * слева, хайрлайн снизу. Нативные хедеры навигации выключены — панель рендерит
 * сам экран. `Appbar.Header` добавляет верхнюю safe-area врезку.
 */
export function AppHeader({
  title,
  onBack,
  leading,
  actions = [],
  titleSlot,
  centerTitle,
}: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Appbar.Header mode="small" elevated={false} style={styles.header}>
      {onBack ? (
        <Appbar.BackAction onPress={onBack} accessibilityLabel="Назад" />
      ) : leading ? (
        <View style={styles.actionWrap}>
          <Appbar.Action
            icon={leading.icon}
            onPress={leading.onPress}
            accessibilityLabel={leading.accessibilityLabel}
          />
          {leading.badge ? <View style={styles.badgeDot} /> : null}
        </View>
      ) : null}

      {titleSlot ? (
        <View style={styles.titleSlot}>{titleSlot}</View>
      ) : (
        <Appbar.Content
          title={title ?? ''}
          titleStyle={[styles.title, centerTitle && styles.centerTitle]}
        />
      )}

      {actions.map((action) => (
        <View key={action.icon} style={styles.actionWrap}>
          <Appbar.Action
            icon={action.icon}
            onPress={action.onPress}
            accessibilityLabel={action.accessibilityLabel}
          />
          {action.badge ? <View style={styles.badgeDot} /> : null}
        </View>
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
    centerTitle: {
      textAlign: 'center',
    },
    titleSlot: {
      flex: 1,
      alignSelf: 'stretch',
    },
    actionWrap: {
      alignSelf: 'center',
    },
    badgeDot: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: theme.colors.error,
      borderWidth: 1,
      borderColor: theme.colors.surface,
    },
  });
