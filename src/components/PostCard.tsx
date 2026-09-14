import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar, Menu, Text, type MD3Theme } from 'react-native-paper';

import type { ReactionSummary } from '@/types/reactions';
import { useAppTheme } from '@/theme';
import { formatDateTime } from '@/utils/formatDateTime';
import { ConfirmDialog } from './ConfirmDialog';
import { ExpandableText } from './ExpandableText';
import { Icon, type IconName } from './Icon';
import { PostPhotos } from './PostPhotos';
import { ReactionControl } from './ReactionControl';
import { ReputationBadge } from './ReputationBadge';

/** Автор поста — ровно то, что нужно карточке (совместимо с `PostAuthor` из сервиса). */
export type PostCardAuthor = {
  id: string;
  nickname: string;
  avatarUrl?: string;
  reputation: number;
};

type PostActionProps = {
  icon: IconName;
  label: string;
  /** Счётчик рядом с иконкой; 0 / undefined — не показываем. */
  count?: number;
  onPress?: () => void;
};

/** Действие под постом — иконка и необязательный счётчик. */
function PostAction({ icon, label, count, onPress }: PostActionProps) {
  const theme = useAppTheme();
  const color = theme.colors.onSurfaceVariant;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        actionStyles.action,
        pressed && actionStyles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon name={icon} size={18} color={color} />
      {count ? <Text style={[actionStyles.count, { color }]}>{count}</Text> : null}
    </Pressable>
  );
}

const actionStyles = StyleSheet.create({
  action: {
    minWidth: 32,
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pressed: {
    opacity: 0.6,
  },
  count: {
    fontSize: 13,
    fontWeight: '600',
  },
});

type PostCardProps = {
  author: PostCardAuthor;
  title: string;
  description?: string;
  images?: string[];
  /** Показать плейсхолдер вместо фото — см. `PostPhotos`. */
  photosUnavailable?: boolean;
  /** Без обработчика аватар/ник не кликабельны. */
  onAuthorPress?: () => void;
  /** Дата создания — показывается в ряду действий справа, в том же формате, что и у комментариев. */
  createdAt?: string;
  /** Свод реакций по типам. Без него в ряду действий рисуется статичная иконка. */
  reactions?: ReactionSummary[];
  onToggleReaction?: (code: string) => void;
  commentCount?: number;
  onComment?: () => void;
  /** Название привязанного поля — строка с гео-маркером над рядом активности. */
  fieldName?: string;
  /** Без обработчика кнопка «На карте» не рисуется — у поста нет привязанного поля. */
  onMap?: () => void;
  /** Если передан `onEdit` или `onDelete` — в углу поста появляются «три точки». */
  onEdit?: () => void;
  onDelete?: () => void;
  /** false скрывает «⋮» целиком — например, в превью ещё не опубликованного
   *  поста: там нечего ни редактировать этим меню (правит сам мастер), ни
   *  жаловаться (это черновик, а не чужой пост). По умолчанию — показывать. */
  showMenu?: boolean;
};

/**
 * Пост в ленте. Общий presentational-компонент — одинаково рисует свой пост и
 * пост другого пользователя. Обязательны только `author` и `title`.
 * Пост на всю ширину, без рамки/фона, разделяется нижней полоской.
 * Тап по аватару/нику (если дан `onAuthorPress`) — переход в профиль автора.
 * Несколько фото — свайпаемая карусель с точками (`PostPhotos`); тап по фото
 * открывает полноэкранный просмотр. Тап по остальному телу (заголовок/описание)
 * ничего не делает — единственный переход в `PostDetail` — клик по комментарию.
 * «Три точки» есть всегда: на своём посте — меню «Редактировать / Удалить»
 * (когда родитель дал `onEdit`/`onDelete`), на чужом — «Пожаловаться» (только
 * подтверждение, без обращения к бэкенду — жалобы пока никуда не сохраняются).
 */
export function PostCard({
  author,
  title,
  description,
  images,
  photosUnavailable,
  onAuthorPress,
  createdAt,
  reactions,
  onToggleReaction,
  commentCount,
  onComment,
  fieldName,
  onMap,
  onEdit,
  onDelete,
  showMenu = true,
}: PostCardProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportDialogVisible, setReportDialogVisible] = useState(false);
  const hasMenu = Boolean(onEdit || onDelete);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          onPress={onAuthorPress}
          disabled={!onAuthorPress}
          style={styles.headerMain}
          accessibilityRole={onAuthorPress ? 'button' : undefined}
          accessibilityLabel={onAuthorPress ? `Профиль ${author.nickname}` : undefined}
        >
          {author.avatarUrl ? (
            <Avatar.Image size={36} source={{ uri: author.avatarUrl }} />
          ) : (
            <Avatar.Icon
              size={36}
              icon="account"
              style={styles.avatar}
              color={theme.colors.onSurfaceVariant}
            />
          )}
          <View style={styles.nameColumn}>
            <ReputationBadge value={author.reputation} nickname={author.nickname} isMine={hasMenu} />
            <Text style={styles.nickname}>{author.nickname}</Text>
          </View>
        </Pressable>

        {showMenu ? (
        <Menu
          visible={menuOpen}
          onDismiss={() => setMenuOpen(false)}
          contentStyle={styles.menuContent}
          anchor={
            <Pressable
              onPress={() => setMenuOpen(true)}
              hitSlop={6}
              style={actionStyles.action}
              accessibilityRole="button"
              accessibilityLabel="Действия с постом"
            >
              <Icon
                name="dots-vertical"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </Pressable>
          }
        >
          {hasMenu ? (
            <>
              <Menu.Item
                leadingIcon={() => (
                  <Icon
                    name="pencil-outline"
                    size={20}
                    color={theme.colors.onSurface}
                  />
                )}
                title="Редактировать"
                titleStyle={styles.menuItemText}
                onPress={() => {
                  setMenuOpen(false);
                  onEdit?.();
                }}
              />
              <Menu.Item
                leadingIcon={() => (
                  <Icon
                    name="trash-can-outline"
                    size={20}
                    color={theme.colors.error}
                  />
                )}
                title="Удалить"
                titleStyle={styles.menuItemDanger}
                onPress={() => {
                  setMenuOpen(false);
                  onDelete?.();
                }}
              />
            </>
          ) : (
            <Menu.Item
              leadingIcon={() => (
                <Icon name="flag-outline" size={20} color={theme.colors.error} />
              )}
              title="Пожаловаться"
              titleStyle={styles.menuItemDanger}
              onPress={() => {
                setMenuOpen(false);
                setReportDialogVisible(true);
              }}
            />
          )}
        </Menu>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {description ? (
          <ExpandableText style={styles.description}>{description}</ExpandableText>
        ) : null}
      </View>

      {images && images.length > 0 ? (
        <PostPhotos images={images} unavailable={photosUnavailable} />
      ) : null}

      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          {reactions && onToggleReaction ? (
            <ReactionControl reactions={reactions} onToggle={onToggleReaction} />
          ) : (
            <PostAction icon="thumb-up-outline" label="Реакция" />
          )}
          <PostAction
            icon="comment-outline"
            label="Комментарии"
            count={commentCount}
            onPress={onComment}
          />
          {onMap && fieldName ? (
            <Pressable
              onPress={onMap}
              hitSlop={6}
              style={({ pressed }) => [actionStyles.action, pressed && actionStyles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Поле ${fieldName} на карте`}
            >
              <Icon name="map-outline" size={18} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.fieldText}>{fieldName}</Text>
            </Pressable>
          ) : null}
        </View>
        {createdAt ? <Text style={styles.date}>{formatDateTime(createdAt)}</Text> : null}
      </View>

      <ConfirmDialog
        visible={reportDialogVisible}
        title="Отправить жалобу?"
        message="Уверены, что хотите отправить жалобу на этот пост?"
        confirmLabel="Отправить"
        destructive
        onConfirm={() => setReportDialogVisible(false)}
        onCancel={() => setReportDialogVisible(false)}
      />
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    card: {
      paddingTop: 14,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
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
    headerMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    nameColumn: {
      flex: 1,
    },
    date: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
    },
    avatar: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    nickname: {
      color: theme.colors.onSurface,
      fontSize: 15,
      fontWeight: '700',
    },
    body: {
      paddingHorizontal: 16,
      paddingTop: 10,
      gap: 4,
    },
    title: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: '700',
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      lineHeight: 20,
    },
    fieldText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    actionsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
  });
