import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Text, type MD3Theme } from 'react-native-paper';

import { useAppTheme } from '@/theme';

/** Данные профиля для отображения — подмножество строки `profiles`, независимое
 *  от сессии: тем же компонентом показываем и свой профиль, и чужой. */
export type ProfileInfoData = {
  name?: string;
  specialization?: string;
  region?: string;
  avatarUrl?: string;
};

/** Тексты-подсказки для незаполненных полей. Задаёт родитель: у своего профиля —
 *  «Укажите…», у чужого можно не передавать (пустые строки просто скрываются). */
export type ProfileInfoPlaceholders = {
  name?: string;
  specialization?: string;
  region?: string;
};

type ProfileInfoProps = {
  profile: ProfileInfoData;
  placeholders?: ProfileInfoPlaceholders;
};

/**
 * Блок «аватар + имя + данные» профиля. Чистый presentational-компонент:
 * всё приходит через пропы, без обращения к сессии.
 */
export function ProfileInfo({ profile, placeholders }: ProfileInfoProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const line = (
    value: string | undefined,
    placeholder: string | undefined,
    isName = false,
  ): ReactNode => {
    const filled = Boolean(value);
    if (!filled && !placeholder) return null;
    return (
      <Text
        style={[isName ? styles.name : styles.detail, !filled && styles.placeholder]}
      >
        {filled ? value : placeholder}
      </Text>
    );
  };

  return (
    <View style={styles.row}>
      {profile.avatarUrl ? (
        <Avatar.Image size={72} source={{ uri: profile.avatarUrl }} />
      ) : (
        <Avatar.Icon
          size={72}
          icon="account"
          style={styles.avatar}
          color={theme.colors.onSurfaceVariant}
        />
      )}
      <View style={styles.column}>
        {line(profile.name, placeholders?.name, true)}
        {line(profile.specialization, placeholders?.specialization)}
        {line(profile.region, placeholders?.region)}
      </View>
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    avatar: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    column: {
      flex: 1,
    },
    name: {
      color: theme.colors.onSurface,
      fontSize: 18,
      fontWeight: '700',
    },
    detail: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      marginTop: 2,
    },
    placeholder: {
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
  });
