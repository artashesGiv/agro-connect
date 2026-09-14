import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, type MD3Theme } from 'react-native-paper';

import type { PendingPost } from '@/services/postQueue';
import { useAppTheme } from '@/theme';

import { Icon } from './Icon';
import { PostCard, type PostCardAuthor } from './PostCard';

type Props = {
  post: PendingPost;
  author: PostCardAuthor;
  sending: boolean;
  onRetry: () => void;
  onDelete: () => void;
};

/**
 * Пост, отложенный из-за отсутствия сети (см. `usePendingPosts`). Оборачивает
 * обычный `PostCard` — тот же вид, что будет в ленте, — полоской статуса и
 * действиями «Отправить сейчас» / «Удалить»; сам `PostCard` не меняется.
 */
export function PendingPostCard({ post, author, sending, onRetry, onDelete }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Icon name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
        <Text style={styles.badgeText}>
          Ожидает отправки — появится в ленте после подключения к интернету
        </Text>
      </View>
      <PostCard
        author={author}
        title={post.input.title ?? 'Без заголовка'}
        description={post.input.body ?? undefined}
        images={post.photos.map((photo) => photo.uri)}
        createdAt={post.createdAt}
      />
      <View style={styles.actions}>
        <Button compact onPress={onRetry} loading={sending} disabled={sending}>
          Отправить сейчас
        </Button>
        <Button
          compact
          textColor={theme.colors.error}
          onPress={onDelete}
          disabled={sending}
        >
          Удалить
        </Button>
      </View>
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    badgeText: {
      flex: 1,
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      fontWeight: '600',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 10,
      paddingBottom: 6,
      gap: 4,
    },
  });
