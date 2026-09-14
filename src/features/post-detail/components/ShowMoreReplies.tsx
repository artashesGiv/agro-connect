import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text, type MD3Theme } from 'react-native-paper';

import { useAppTheme } from '@/theme';

type Props = {
  count: number;
  onPress: () => void;
};

/** Кнопка раскрытия свёрнутой ветки ответов — отступ как у `CommentItem.replyRow`. */
export function ShowMoreReplies({ count, onPress }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel={`Показать ещё ${count}`}
    >
      <Text style={styles.text}>Показать ещё {count}</Text>
    </Pressable>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    wrap: {
      marginLeft: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    text: {
      color: theme.colors.primary,
      fontSize: 13,
      fontWeight: '600',
    },
  });
