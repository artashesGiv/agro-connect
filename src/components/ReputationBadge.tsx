import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, type MD3Theme } from 'react-native-paper';

import { useAppTheme } from '@/theme';

import { Icon } from './Icon';

type Props = {
  value: number;
  size?: number;
};

/** Звезда + число рейтинга — рядом с именем в профиле, посте и комментарии. */
export function ReputationBadge({ value, size = 14 }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <Icon name="star" size={size} color={theme.colors.onSurfaceVariant} />
      <Text style={styles.text}>{value}</Text>
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    text: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
    },
  });
