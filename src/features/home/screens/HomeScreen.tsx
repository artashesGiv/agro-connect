import { useCallback, useMemo, useRef, useState } from 'react';
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
import { PostCard } from '@/components/PostCard';
import { useReactions } from '@/hooks/useReactions';
import type { HomeScreenProps } from '@/navigation/types';
import { useAuth } from '@/services/auth';
import { deletePost } from '@/services/posts';
import { toggleReactionSummary } from '@/services/reactions';
import { toUserMessage } from '@/services/supabase';
import { useAppTheme } from '@/theme';

import { useFeed, type FeedItem } from '../hooks/useFeed';

/**
 * Вкладка «Главная»: бесконечная лента всех постов. Первая страница 15 постов,
 * дальше подгрузка по 15 при долистывании (keyset-курсор в `useFeed`),
 * pull-to-refresh. Карточки интерактивные; меню «редактировать/удалить» — только
 * на своих постах.
 */
export default function HomeScreen({ navigation }: HomeScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user } = useAuth();
  const { setReaction } = useReactions();
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
  } = useFeed();

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
          onPress={() => openPost(item.id)}
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
          onMap={fieldId ? () => openFieldOnMap(fieldId) : undefined}
        />
      );
    },
    [openPost, editPost, handleToggleReaction, openFieldOnMap],
  );

  return (
    <View style={styles.root}>
      <AppHeader title="Главная" />

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
            <Text style={styles.stateText}>Постов пока нет</Text>
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
