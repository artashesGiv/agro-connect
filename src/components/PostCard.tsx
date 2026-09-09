import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Avatar, Menu, Text, type MD3Theme } from 'react-native-paper';

import { useAppTheme } from '@/theme';
import { Icon, type IconName } from './Icon';

/** Автор поста — ровно то, что нужно карточке (совместимо с `PostAuthor` из сервиса). */
export type PostCardAuthor = {
  nickname: string;
  avatarUrl?: string;
};

type PostActionProps = {
  icon: IconName;
  label: string;
  /** Подсветка активного состояния (закладка). */
  active?: boolean;
  onPress?: () => void;
};

/** Действие под постом — просто иконка (счётчики пока не показываем). */
function PostAction({ icon, label, active, onPress }: PostActionProps) {
  const theme = useAppTheme();
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
      accessibilityState={active != null ? { selected: active } : undefined}
    >
      <Icon
        name={icon}
        size={18}
        color={active ? theme.colors.primary : theme.colors.onSurfaceVariant}
      />
    </Pressable>
  );
}

const actionStyles = StyleSheet.create({
  action: {
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});

type PostCardProps = {
  author: PostCardAuthor;
  title: string;
  description?: string;
  images?: string[];
  bookmarked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onBookmark?: () => void;
  onMap?: () => void;
  /** Если передан `onEdit` или `onDelete` — в углу поста появляются «три точки». */
  onEdit?: () => void;
  onDelete?: () => void;
};

/**
 * Пост в ленте. Общий presentational-компонент — одинаково рисует свой пост и
 * пост другого пользователя. Обязательны только `author` и `title`.
 * Пост на всю ширину, без рамки/фона, разделяется нижней полоской.
 * Фото пока одно (`images[0]`); слайдер для нескольких — на будущее.
 * «Три точки» с меню «Редактировать / Удалить» показываем, когда родитель дал
 * `onEdit`/`onDelete` (для своих постов).
 */
export function PostCard({
  author,
  title,
  description,
  images,
  bookmarked,
  onLike,
  onComment,
  onBookmark,
  onMap,
  onEdit,
  onDelete,
}: PostCardProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [menuOpen, setMenuOpen] = useState(false);
  const cover = images?.[0];
  const hasMenu = Boolean(onEdit || onDelete);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerMain}>
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
          <Text style={styles.nickname}>{author.nickname}</Text>
        </View>

        {hasMenu ? (
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
          </Menu>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>

      {cover ? (
        <Image
          source={{ uri: cover }}
          style={styles.cover}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}

      <View style={styles.actions}>
        <PostAction icon="thumb-up-outline" label="Нравится" onPress={onLike} />
        <PostAction icon="comment-outline" label="Комментарии" onPress={onComment} />
        <PostAction
          icon={bookmarked ? 'bookmark' : 'bookmark-outline'}
          label={bookmarked ? 'Убрать из закладок' : 'В закладки'}
          active={bookmarked}
          onPress={onBookmark}
        />
        <PostAction icon="map-outline" label="На карте" onPress={onMap} />
      </View>
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
    cover: {
      width: '100%',
      aspectRatio: 4 / 3,
      marginTop: 12,
      backgroundColor: theme.colors.surfaceVariant,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
  });
