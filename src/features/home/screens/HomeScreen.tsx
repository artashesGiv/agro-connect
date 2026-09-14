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
import { CropFilterSelect } from '@/components/CropFilterSelect';
import { ExpandingSearchField } from '@/components/ExpandingSearchField';
import { PendingPostCard } from '@/components/PendingPostCard';
import { PostCard } from '@/components/PostCard';
import { StageFilterSelect } from '@/components/StageFilterSelect';
import { useCrops } from '@/hooks/useCrops';
import { useFeed, type FeedItem } from '@/hooks/useFeed';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePendingPosts } from '@/hooks/usePendingPosts';
import { useStages } from '@/hooks/useStages';
import { useReactions } from '@/hooks/useReactions';
import type { HomeScreenProps } from '@/navigation/types';
import { useAuth } from '@/services/auth';
import { deletePost } from '@/services/posts';
import { toggleReactionSummary } from '@/services/reactions';
import { storage, toUserMessage } from '@/services/supabase';
import { useAppTheme } from '@/theme';

/** Пауза после последнего нажатия клавиши перед тем, как поиск уйдёт в запрос. */
const SEARCH_DEBOUNCE_MS = 400;

/**
 * Вкладка «Главная»: бесконечная лента всех постов. Первая страница 15 постов,
 * дальше подгрузка по 15 при долистывании (keyset-курсор в `useFeed`),
 * pull-to-refresh. Карточки интерактивные; меню «редактировать/удалить» — только
 * на своих постах.
 */
export default function HomeScreen({ navigation }: HomeScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user, profile } = useAuth();
  const isOnline = useNetworkStatus();
  const { setReaction } = useReactions();
  const { crops } = useCrops();
  const { stages } = useStages();
  const {
    items: pendingItems,
    processing: pendingSending,
    retryAll: retryPendingPosts,
    remove: removePendingPost,
  } = usePendingPosts();

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [cropIds, setCropIds] = useState<number[]>([]);
  const [stageIds, setStageIds] = useState<number[]>([]);

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
    cropIds: cropIds.length ? cropIds : undefined,
    stageIds: stageIds.length ? stageIds : undefined,
    search: search || undefined,
    postTypeCode: 'field_update',
  });
  const filtered = Boolean(search) || cropIds.length > 0 || stageIds.length > 0;

  // Показываем офлайн-черновики только на «чистой» ленте: у отложенного поста
  // культура ещё не известна (её вычисляет сервер по полю), под фильтр по
  // культуре/поиск подвести его нельзя.
  const pendingForFeed = filtered
    ? []
    : pendingItems.filter((item) => item.input.postTypeCode === 'field_update');
  const [pendingDeleteQueueId, setPendingDeleteQueueId] = useState<string | null>(null);
  const confirmDeletePending = useCallback(async () => {
    if (!pendingDeleteQueueId) return;
    await removePendingPost(pendingDeleteQueueId);
    setPendingDeleteQueueId(null);
  }, [pendingDeleteQueueId, removePendingPost]);
  const pendingAvatarUrl = profile?.avatar_path
    ? storage.getAvatarUrl(profile.avatar_path)
    : undefined;

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
    (fieldId: string) => {
      navigation.navigate('Map', { focusFieldId: fieldId, openCard: true });
    },
    [navigation],
  );

  const openAuthor = useCallback(
    (authorId: string, isMine: boolean) => {
      if (isMine) {
        navigation.navigate('Profile');
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
      const fieldId = item.fieldId;
      return (
        <PostCard
          author={item.author}
          title={item.title}
          description={item.description}
          images={item.images}
          photosUnavailable={!isOnline}
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
          onMap={fieldId ? () => openFieldOnMap(fieldId) : undefined}
        />
      );
    },
    [openPost, editPost, handleToggleReaction, openFieldOnMap, openAuthor, isOnline],
  );

  return (
    <View style={styles.root}>
      <AppHeader
        titleSlot={
          <ExpandingSearchField
            visible={searchVisible}
            value={searchInput}
            onChangeText={setSearchInput}
            title="Главная"
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
      <View style={styles.filtersRow}>
        <CropFilterSelect crops={crops} value={cropIds} onChange={setCropIds} />
        <StageFilterSelect stages={stages} value={stageIds} onChange={setStageIds} />
      </View>

      {loading && items.length === 0 && pendingForFeed.length === 0 ? (
        <ActivityIndicator style={styles.loader} />
      ) : error && items.length === 0 && pendingForFeed.length === 0 ? (
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
            <RefreshControl
              refreshing={refreshing || (loading && items.length > 0)}
              onRefresh={() => void refresh()}
            />
          }
          ListHeaderComponent={
            pendingForFeed.length > 0 ? (
              <View>
                {pendingForFeed.map((post) => (
                  <PendingPostCard
                    key={post.id}
                    post={post}
                    author={{
                      id: user?.id ?? '',
                      nickname: profile?.name ?? 'вы',
                      avatarUrl: pendingAvatarUrl,
                      reputation: profile?.reputation ?? 0,
                    }}
                    sending={pendingSending}
                    onRetry={retryPendingPosts}
                    onDelete={() => setPendingDeleteQueueId(post.id)}
                  />
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            pendingForFeed.length === 0 ? (
              <Text style={styles.stateText}>
                {filtered ? 'Ничего не найдено' : 'Постов пока нет'}
              </Text>
            ) : null
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
        visible={pendingDeleteQueueId !== null}
        title="Удалить черновик?"
        message="Пост так и не будет отправлен. Это действие нельзя отменить."
        confirmLabel="Удалить"
        destructive
        onConfirm={confirmDeletePending}
        onCancel={() => setPendingDeleteQueueId(null)}
      />

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
    filtersRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
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
