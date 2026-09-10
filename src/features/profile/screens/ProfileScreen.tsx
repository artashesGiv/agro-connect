import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Divider,
  IconButton,
  List,
  Snackbar,
  Text,
  type MD3Theme,
} from 'react-native-paper';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PostCard } from '@/components/PostCard';
import { ProfileInfo } from '@/components/ProfileInfo';
import { useFields } from '@/hooks/useFields';
import { useReactions } from '@/hooks/useReactions';
import type { ProfileScreenProps } from '@/navigation/types';
import { useAuth } from '@/services/auth';
import { deleteField, type Field } from '@/services/fields';
import { deletePost } from '@/services/posts';
import { toggleReactionSummary } from '@/services/reactions';
import { storage, toUserMessage } from '@/services/supabase';
import { useAppTheme } from '@/theme';

import { ProfileHeader } from '../components/ProfileHeader';
import {
  ProfileSectionTabs,
  type ProfileSection,
} from '../components/ProfileSectionTabs';
import { useUserPosts } from '../hooks/useUserPosts';

/** Подсказки для незаполненных полей своего профиля. */
const OWN_PROFILE_PLACEHOLDERS = {
  name: 'Укажите имя',
  specialization: 'Укажите специализацию',
  region: 'Укажите регион',
};

/**
 * Вкладка «Профиль»: своя шапка (уведомления / @имя / настройки), карточка
 * профиля (общий компонент `ProfileInfo`, данные из строки `profiles`) и
 * переключатель секций «Мои посты / Закладки / Мои поля». «Мои посты» — реальные
 * посты автора из ленты (`useUserPosts`) с реакциями и счётчиком комментариев;
 * «Мои поля» — строки `fields`, которые правятся на вкладке «Карта».
 *
 * Экран не обёрнут в `Screen`: у него фиксированная шапка (`AppHeader` через
 * `ProfileHeader`) над скроллом — верхнюю safe-area врезку даёт она, нижнюю — таб-бар.
 */
export default function ProfileScreen({ navigation, route }: ProfileScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user, profile } = useAuth();
  const [section, setSection] = useState<ProfileSection>('posts');
  const { posts, setPosts, loading, error, reload, syncItem } = useUserPosts(user?.id);
  const { setReaction } = useReactions();
  const {
    fields,
    loading: fieldsLoading,
    error: fieldsError,
    reload: reloadFields,
  } = useFields();

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDeleteField, setPendingDeleteField] = useState<Field | null>(null);
  const [deletingField, setDeletingField] = useState(false);
  /** Транзиентные сообщения: ошибка реакции, «Поле удалено» и т.п. */
  const [notice, setNotice] = useState<string | null>(null);
  /** id поста, открытого в PostDetail/EditPost — перечитываем его при возврате. */
  const openedRef = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      // Вернулись с PostDetail/EditPost — точечно обновляем один пост.
      const openedId = openedRef.current;
      openedRef.current = null;
      if (openedId) void syncItem(openedId);
      // После создания поста (мастер «+» уводит сюда) — полный reload: новый
      // пост точечно не подтянуть.
      if (route.params?.refresh) {
        void reload();
        navigation.setParams({ refresh: undefined });
      }
      // Поля — маленький список без пагинации, освежаем всегда (правка на карте).
      void reloadFields();
    }, [syncItem, reload, reloadFields, route.params?.refresh, navigation]),
  );

  const openPost = useCallback(
    (postId: string) => {
      openedRef.current = postId;
      navigation.navigate('PostDetail', { postId });
    },
    [navigation],
  );

  const editPost = useCallback(
    (postId: string) => {
      openedRef.current = postId;
      navigation.navigate('EditPost', { postId });
    },
    [navigation],
  );

  const closeDeleteDialog = useCallback(() => {
    setPendingDeleteId(null);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deletePost(pendingDeleteId);
      await reload();
      setPendingDeleteId(null);
    } catch (cause) {
      setDeleteError(toUserMessage(cause));
    } finally {
      setDeleting(false);
    }
  }, [pendingDeleteId, reload]);

  const handleToggleReaction = useCallback(
    async (postId: string, code: string) => {
      if (!user) return;
      const target = posts.find((post) => post.id === postId);
      if (!target) return;
      const { next, previousCode, nextCode } = toggleReactionSummary(
        target.reactions,
        code,
      );
      const snapshot = posts;
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, reactions: next } : post,
        ),
      );
      try {
        await setReaction({
          postId,
          userId: user.id,
          previous: previousCode,
          next: nextCode,
        });
      } catch (cause) {
        setPosts(snapshot);
        setNotice(
          cause instanceof Error ? cause.message : 'Не удалось сохранить реакцию.',
        );
      }
    },
    [posts, user, setPosts, setReaction],
  );

  const confirmDeleteField = useCallback(async () => {
    if (!pendingDeleteField) return;
    setDeletingField(true);
    setDeleteError(null);
    try {
      await deleteField(pendingDeleteField.id);
      setPendingDeleteField(null);
      setNotice('Поле удалено');
      await reloadFields();
    } catch (cause) {
      setDeleteError(toUserMessage(cause));
    } finally {
      setDeletingField(false);
    }
  }, [pendingDeleteField, reloadFields]);

  /**
   * Переход к полю на карту. Параметры чистим явно даже когда поля нет: таб
   * помнит их между переходами, и без этого «Добавить поле» унесло бы к
   * последнему открытому.
   */
  const openOnMap = useCallback(
    (field: Field | null, withCard: boolean) => {
      navigation.navigate('Map', {
        focusFieldId: field?.id,
        openCard: field ? withCard : undefined,
      });
    },
    [navigation],
  );

  const avatarUrl = profile?.avatar_path
    ? storage.getAvatarUrl(profile.avatar_path)
    : undefined;

  return (
    <View style={styles.root}>
      <ProfileHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ProfileInfo
          profile={{
            name: profile?.name ?? undefined,
            specialization: profile?.specialization ?? undefined,
            region: profile?.region ?? undefined,
            avatarUrl,
          }}
          placeholders={OWN_PROFILE_PLACEHOLDERS}
        />
        <Divider />
        <ProfileSectionTabs value={section} onChange={setSection} />

        <View style={styles.section}>
          {section === 'bookmarks' ? (
            <Text style={styles.stateText}>Закладки</Text>
          ) : section === 'fields' ? (
            <FieldsSection
              fields={fields}
              loading={fieldsLoading}
              error={fieldsError}
              styles={styles}
              errorColor={theme.colors.error}
              onOpen={openOnMap}
              onDelete={setPendingDeleteField}
            />
          ) : error && posts.length === 0 ? (
            <Text style={styles.stateText}>{error}</Text>
          ) : loading && posts.length === 0 ? (
            <ActivityIndicator style={styles.loader} />
          ) : posts.length === 0 ? (
            <Text style={styles.stateText}>Постов пока нет</Text>
          ) : (
            // .map, а не FlatList — список внутри ScrollView. Заменить на FlatList,
            // когда постов станет много / появится пагинация.
            posts.map((post) => (
              <PostCard
                key={post.id}
                author={post.author}
                title={post.title}
                description={post.description}
                images={post.images}
                onPress={() => openPost(post.id)}
                reactions={post.reactions}
                onToggleReaction={(code) => handleToggleReaction(post.id, code)}
                commentCount={post.commentCount}
                onComment={() => openPost(post.id)}
                onEdit={() => editPost(post.id)}
                onDelete={() => {
                  setDeleteError(null);
                  setPendingDeleteId(post.id);
                }}
              />
            ))
          )}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={pendingDeleteId !== null}
        title="Удалить пост?"
        message="Это действие нельзя отменить."
        confirmLabel="Удалить"
        destructive
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteDialog}
      />

      <ConfirmDialog
        visible={pendingDeleteField !== null}
        icon="trash-can-outline"
        title="Удалить поле?"
        message={`«${pendingDeleteField?.name ?? ''}» будет удалено безвозвратно.`}
        confirmLabel="Удалить"
        destructive
        loading={deletingField}
        error={deleteError}
        onConfirm={confirmDeleteField}
        onCancel={() => {
          setPendingDeleteField(null);
          setDeleteError(null);
        }}
      />

      <Snackbar
        visible={notice !== null}
        onDismiss={() => setNotice(null)}
        duration={4000}
      >
        {notice ?? ''}
      </Snackbar>
    </View>
  );
}

type FieldsSectionProps = {
  fields: Field[];
  loading: boolean;
  error: string | null;
  styles: ReturnType<typeof makeStyles>;
  errorColor: string;
  onOpen: (field: Field | null, withCard: boolean) => void;
  onDelete: (field: Field) => void;
};

/** Секция «Мои поля»: список, переход на карту и удаление. */
function FieldsSection({
  fields,
  loading,
  error,
  styles,
  errorColor,
  onOpen,
  onDelete,
}: FieldsSectionProps) {
  if (error) return <Text style={styles.stateText}>{error}</Text>;
  if (loading && fields.length === 0) return <ActivityIndicator style={styles.loader} />;

  if (fields.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Полей пока нет. Добавьте первое — карта откроется на вашем местоположении.
        </Text>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => onOpen(null, false)}
          accessibilityLabel="Добавить поле на карте"
        >
          Добавить поле
        </Button>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.fieldsHeader}>
        <IconButton
          icon="plus"
          size={20}
          onPress={() => onOpen(null, false)}
          accessibilityLabel="Добавить поле на карте"
        />
      </View>
      {fields.map((field, index) => (
        <View key={field.id}>
          {index > 0 ? <Divider /> : null}
          <List.Item
            title={field.name}
            description={describe(field)}
            onPress={() => onOpen(field, false)}
            right={() => (
              <View style={styles.itemActions}>
                <IconButton
                  icon="pencil-outline"
                  size={20}
                  onPress={() => onOpen(field, true)}
                  accessibilityLabel={`Редактировать поле ${field.name}`}
                />
                <IconButton
                  icon="trash-can-outline"
                  size={20}
                  iconColor={errorColor}
                  onPress={() => onDelete(field)}
                  accessibilityLabel={`Удалить поле ${field.name}`}
                />
              </View>
            )}
          />
        </View>
      ))}
    </View>
  );
}

/** Вторая строка в списке: чем поле описано, тем и описываем. */
function describe(field: Field): string {
  const shape = field.boundary ? `контур, ${field.boundary.length} точек` : 'точка';
  return field.region ? `${field.region} · ${shape}` : shape;
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flexGrow: 1,
      paddingBottom: 24,
    },
    section: {
      flex: 1,
    },
    loader: {
      marginTop: 32,
    },
    stateText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 32,
      paddingHorizontal: 24,
    },
    fieldsHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingRight: 4,
    },
    itemActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    empty: {
      alignItems: 'center',
      gap: 16,
      marginTop: 32,
      paddingHorizontal: 24,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      lineHeight: 22,
      textAlign: 'center',
    },
  });
