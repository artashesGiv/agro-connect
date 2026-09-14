import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Button,
  Snackbar,
  Text,
  type MD3Theme,
} from 'react-native-paper';

import { AppHeader } from '@/components/AppHeader';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ExpandingSearchField } from '@/components/ExpandingSearchField';
import { PostCard } from '@/components/PostCard';
import { useFeed, type FeedItem } from '@/hooks/useFeed';
import { useReactions } from '@/hooks/useReactions';
import type { RelatedPostsScreenProps } from '@/navigation/types';
import { useAuth } from '@/services/auth';
import { deletePost } from '@/services/posts';
import { toggleReactionSummary } from '@/services/reactions';
import { toUserMessage } from '@/services/supabase';
import { useAppTheme } from '@/theme';

/** Пауза после последнего нажатия клавиши перед тем, как поиск уйдёт в запрос. */
const SEARCH_DEBOUNCE_MS = 400;

/**
 * «Связанные посты» — вход с карточки своего поля на карте. Та же лента, что
 * «Главная»/«Вопросы», но отфильтрована на `fieldId` без `postTypeCode` —
 * посты и вопросы этого поля вперемешку, в одном хронологическом списке.
 * Стек-экран (не таб): своя кнопка «Назад» в `AppHeader`.
 */
export default function RelatedPostsScreen({
  navigation,
  route,
}: RelatedPostsScreenProps) {
  const { fieldId, fieldName } = route.params;
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user } = useAuth();
  const { setReaction } = useReactions();

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const toggleSearch = useCallback(() => {
    setSearchVisible((prev) => {
      if (prev) setSearchInput('');
      return !prev;
    });
  }, []);

  const {
    items,
    setItems,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    loadMore,
    refresh,
    retry,
    syncItem,
  } = useFeed({
    fieldId,
    search: search || undefined,
  });
  const filtered = Boolean(search);

  /** id поста, открытого в PostDetail/EditPost — перечитываем его при возврате. */
  const openedRef = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const id = openedRef.current;
      openedRef.current = null;
      if (id) void syncItem(id);
    }, [syncItem]),
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

  const openFieldOnMap = useCallback(
    (targetFieldId: string) => {
      navigation.navigate('Tabs', {
        screen: 'Map',
        params: { focusFieldId: targetFieldId, openCard: true },
      });
    },
    [navigation],
  );

  const openAuthor = useCallback(
    (authorId: string, isMine: boolean) => {
      if (isMine) {
        navigation.navigate('Tabs', { screen: 'Profile' });
      } else {
        navigation.navigate('UserProfile', { userId: authorId });
      }
    },
    [navigation],
  );

  const [notice, setNotice] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleToggleReaction = useCallback(
    async (postId: string, code: string) => {
      if (!user) return;
      const target = items.find((item) => item.id === postId);
      if (!target) return;
      const { next, previousCode, nextCode } = toggleReactionSummary(
        target.reactions,
        code,
      );
      const snapshot = items;
      setItems((prev) =>
        prev.map((item) =>
          item.id === postId ? { ...item, reactions: next } : item,
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
        setItems(snapshot);
        setNotice(
          cause instanceof Error ? cause.message : 'Не удалось сохранить реакцию.',
        );
      }
    },
    [items, user, setItems, setReaction],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deletePost(pendingDeleteId);
      setItems((prev) => prev.filter((item) => item.id !== pendingDeleteId));
      setPendingDeleteId(null);
    } catch (cause) {
      setDeleteError(toUserMessage(cause));
    } finally {
      setDeleting(false);
    }
  }, [pendingDeleteId, setItems]);

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => {
      const itemFieldId = item.fieldId;
      return (
        <PostCard
          author={item.author}
          title={item.title}
          description={item.description}
          images={item.images}
          onAuthorPress={() => openAuthor(item.author.id, item.isMine)}
          createdAt={item.createdAt}
          reactions={item.reactions}
          onToggleReaction={(code) => handleToggleReaction(item.id, code)}
          commentCount={item.commentCount}
          onComment={() => openPost(item.id)}
          onEdit={item.isMine ? () => editPost(item.id) : undefined}
          onDelete={
            item.isMine
              ? () => {
                  setDeleteError(null);
                  setPendingDeleteId(item.id);
                }
              : undefined
          }
          fieldName={item.fieldName}
          onMap={itemFieldId ? () => openFieldOnMap(itemFieldId) : undefined}
        />
      );
    },
    [openPost, editPost, handleToggleReaction, openFieldOnMap, openAuthor],
  );

  return (
    <View style={styles.root}>
      <AppHeader
        onBack={() => navigation.goBack()}
        titleSlot={
          <ExpandingSearchField
            visible={searchVisible}
            value={searchInput}
            onChangeText={setSearchInput}
            title={fieldName}
            placeholder="Поиск по постам"
          />
        }
        actions={[
          {
            icon: searchVisible ? 'close' : 'magnify',
            onPress: toggleSearch,
            accessibilityLabel: searchVisible ? 'Закрыть поиск' : 'Поиск',
          },
        ]}
      />

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : error && items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.stateText}>{error}</Text>
          <Button mode="contained" onPress={() => void retry()}>
            Повторить
          </Button>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.content}
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
          }
          ListEmptyComponent={
            <Text style={styles.stateText}>
              {filtered ? 'Ничего не найдено' : 'Постов пока нет'}
            </Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footer} />
            ) : !hasMore && items.length > 0 ? (
              <Text style={styles.footerText}>Больше постов нет</Text>
            ) : null
          }
        />
      )}

      <ConfirmDialog
        visible={pendingDeleteId !== null}
        title="Удалить пост?"
        message="Это действие нельзя отменить."
        confirmLabel="Удалить"
        destructive
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setPendingDeleteId(null);
          setDeleteError(null);
        }}
      />

      <Snackbar
        visible={notice !== null}
        onDismiss={() => setNotice(null)}
        duration={3000}
      >
        {notice ?? ''}
      </Snackbar>
    </View>
  );
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
    loader: {
      marginTop: 32,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      paddingHorizontal: 24,
    },
    stateText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 32,
      paddingHorizontal: 24,
    },
    footer: {
      marginVertical: 16,
    },
    footerText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      textAlign: 'center',
      marginVertical: 16,
    },
  });
