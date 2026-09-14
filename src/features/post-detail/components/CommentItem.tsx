import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar, Menu, Text, type MD3Theme } from 'react-native-paper';

import { ExpandableText } from '@/components/ExpandableText';
import { Icon } from '@/components/Icon';
import { ReputationBadge } from '@/components/ReputationBadge';
import { useAppTheme } from '@/theme';
import { formatDateTime } from '@/utils/formatDateTime';

import type { Comment } from '../hooks/useComments';

type Props = {
  comment: Comment;
  onVote: (value: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
  /** Не передаётся для ИИ-комментариев — у них нет своей ветки ответов. */
  onReply?: () => void;
  /** Не передаётся для ИИ-комментариев — у ИИ нет профиля. */
  onAuthorPress?: () => void;
};

export function CommentItem({
  comment,
  onVote,
  onEdit,
  onDelete,
  onReply,
  onAuthorPress,
}: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={[styles.row, Boolean(comment.parentId) && styles.replyRow]}>
      <Pressable onPress={onAuthorPress} disabled={!onAuthorPress}>
        {comment.author.avatarUrl ? (
          <Avatar.Image size={28} source={{ uri: comment.author.avatarUrl }} />
        ) : (
          <Avatar.Icon
            size={28}
            icon={comment.isAi ? 'robot-outline' : 'account'}
            style={styles.avatar}
            color={comment.isAi ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
        )}
      </Pressable>

      <View style={styles.main}>
        <View style={styles.headerLine}>
          <View style={styles.nicknameGroup}>
            {comment.isAi ? (
              <Icon name="robot-outline" size={14} color={theme.colors.primary} />
            ) : null}
            <Pressable onPress={onAuthorPress} disabled={!onAuthorPress}>
              <Text
                style={[styles.nickname, comment.isAi && { color: theme.colors.primary }]}
                numberOfLines={1}
              >
                {comment.author.nickname}
              </Text>
            </Pressable>
            {comment.author.reputation !== undefined ? (
              <ReputationBadge value={comment.author.reputation} size={12} />
            ) : null}
          </View>
          <Text style={styles.when}>
            {formatDateTime(comment.createdAt)}
            {comment.editedAt ? ' · изм.' : ''}
          </Text>

          {comment.isMine ? (
            <Menu
              visible={menuOpen}
              onDismiss={() => setMenuOpen(false)}
              contentStyle={styles.menuContent}
              anchor={
                <Pressable
                  onPress={() => setMenuOpen(true)}
                  hitSlop={6}
                  style={styles.menuAnchor}
                  accessibilityRole="button"
                  accessibilityLabel="Действия с комментарием"
                >
                  <Icon
                    name="dots-horizontal"
                    size={18}
                    color={theme.colors.onSurfaceVariant}
                  />
                </Pressable>
              }
            >
              <Menu.Item
                leadingIcon={() => (
                  <Icon name="pencil-outline" size={20} color={theme.colors.onSurface} />
                )}
                title="Редактировать"
                titleStyle={styles.menuItemText}
                onPress={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
              />
              <Menu.Item
                leadingIcon={() => (
                  <Icon name="trash-can-outline" size={20} color={theme.colors.error} />
                )}
                title="Удалить"
                titleStyle={styles.menuItemDanger}
                onPress={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              />
            </Menu>
          ) : null}
        </View>

        {comment.replyToName ? (
          <Text style={styles.replyToLabel}>Ответ {comment.replyToName}</Text>
        ) : null}

        <ExpandableText style={styles.body}>{comment.body}</ExpandableText>

        {comment.isAi ? null : (
          <View style={styles.votes}>
            <Pressable
              onPress={() => onVote(1)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Полезный комментарий"
              accessibilityState={{ selected: comment.myVote === 1 }}
            >
              <Icon
                name={comment.myVote === 1 ? 'arrow-up-bold' : 'arrow-up-bold-outline'}
                size={18}
                color={comment.myVote === 1 ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
            </Pressable>
            <Text style={styles.score}>{comment.score}</Text>
            <Pressable
              onPress={() => onVote(-1)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Бесполезный комментарий"
              accessibilityState={{ selected: comment.myVote === -1 }}
            >
              <Icon
                name={comment.myVote === -1 ? 'arrow-down-bold' : 'arrow-down-bold-outline'}
                size={18}
                color={comment.myVote === -1 ? theme.colors.error : theme.colors.onSurfaceVariant}
              />
            </Pressable>
            {onReply ? (
              <Pressable
                onPress={onReply}
                hitSlop={8}
                style={styles.replyButton}
                accessibilityRole="button"
                accessibilityLabel="Ответить"
              >
                <Text style={styles.replyButtonText}>Ответить</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    replyRow: {
      marginLeft: 20,
      marginTop: -12,
    },
    avatar: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    main: {
      flex: 1,
      gap: 4,
    },
    headerLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    nicknameGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 1,
    },
    nickname: {
      color: theme.colors.onSurface,
      fontSize: 14,
      fontWeight: '700',
      flexShrink: 1,
    },
    when: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      flex: 1,
    },
    menuAnchor: {
      padding: 2,
    },
    menuContent: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    menuItemText: {
      color: theme.colors.onSurface,
    },
    menuItemDanger: {
      color: theme.colors.error,
    },
    replyToLabel: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '600',
      marginTop: -6,
    },
    body: {
      color: theme.colors.onSurface,
      fontSize: 14,
      lineHeight: 20,
    },
    votes: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 2,
    },
    score: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      fontWeight: '700',
      minWidth: 16,
      textAlign: 'center',
    },
    replyButton: {
      marginLeft: 4,
    },
    replyButtonText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      fontWeight: '700',
    },
  });
