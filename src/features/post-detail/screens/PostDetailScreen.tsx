import { useCallback, useMemo, useState } from 'react';
import { Platform, KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Divider,
  Snackbar,
  Text,
  type MD3Theme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PostCard } from '@/components/PostCard';
import { useReactions } from '@/hooks/useReactions';
import type { PostDetailScreenProps } from '@/navigation/types';
import { useAuth } from '@/services/auth';
import { getPost } from '@/services/posts';
import {
  summarizeReactions,
  toggleReactionSummary,
  type ReactionSummary,
} from '@/services/reactions';
import { dictionaries, storage, toUserMessage } from '@/services/supabase';
import { useAppTheme } from '@/theme';

import {
  CommentComposer,
  type ComposerEditing,
  type ComposerReplyTo,
} from '../components/CommentComposer';
import { CommentItem } from '../components/CommentItem';
import { ShowMoreReplies } from '../components/ShowMoreReplies';
import { useComments, type Comment } from '../hooks/useComments';

/** Сколько ответов ветки показывать без разворачивания. */
const VISIBLE_REPLIES = 2;

type CommentRowView =
  | { kind: 'comment'; comment: Comment }
  | { kind: 'more'; rootId: string; count: number };

/** Идёт вверх по `parentId`, пока не найдёт комментарий-корень ветки. */
function findRootId(comments: Comment[], id: string): string {
  let current = comments.find((c) => c.id === id);
  while (current?.parentId) {
    current = comments.find((c) => c.id === current!.parentId);
  }
  return current?.id ?? id;
}

type PostView = {
  author: { id: string; nickname: string; avatarUrl?: string; reputation: number };
  title: string;
  description?: string;
  images: string[];
  postTypeCode: string;
  fieldId: string | null;
  fieldName: string | null;
  createdAt: string;
};

/** Формулировки зависят от типа поста: вопрос → «ответы», иначе → «комментарии». */
const TERMS = {
  question: {
    empty: 'Пока нет ответов',
    placeholder: 'Ответить',
    submit: 'Ответить',
    editingLabel: 'Редактирование ответа',
    deleteTitle: 'Удалить ответ?',
  },
  post: {
    empty: 'Пока нет комментариев',
    placeholder: 'Комментарий',
    submit: 'Отправить',
    editingLabel: 'Редактирование комментария',
    deleteTitle: 'Удалить комментарий?',
  },
} as const;

export default function PostDetailScreen({
  route,
  navigation,
}: PostDetailScreenProps) {
  const { postId } = route.params;
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user } = useAuth();
  const { setReaction } = useReactions();
  const {
    comments,
    loading: commentsLoading,
    error: commentsError,
    reload: reloadComments,
    add,
    edit,
    remove,
    vote,
  } = useComments(postId);

  const [post, setPost] = useState<PostView | null>(null);
  const [reactions, setReactions] = useState<ReactionSummary[]>([]);
  const [loadingPost, setLoadingPost] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<ComposerEditing>(null);
  const [replyTo, setReplyTo] = useState<ComposerReplyTo>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadPost = useCallback(async () => {
    setLoadingPost(true);
    try {
      const [fetched, activeTypes] = await Promise.all([
        getPost(postId),
        dictionaries.getActiveReactionTypes(),
      ]);
      if (!fetched) {
        setError('Пост не найден.');
        return;
      }
      const media = [...fetched.post_media].sort((a, b) => a.sort_order - b.sort_order);
      const urls = await storage.getPostMediaUrls(media.map((m) => m.storage_path));
      setPost({
        author: {
          id: fetched.profiles?.id ?? '',
          nickname: fetched.profiles?.name ?? 'без имени',
          avatarUrl: fetched.profiles?.avatar_path
            ? storage.getAvatarUrl(fetched.profiles.avatar_path)
            : undefined,
          reputation: fetched.profiles?.reputation ?? 0,
        },
        title: fetched.title ?? 'Без заголовка',
        description: fetched.body ?? undefined,
        images: media
          .map((m) => urls[m.storage_path])
          .filter((u): u is string => Boolean(u)),
        postTypeCode: fetched.post_types?.code ?? 'field_update',
        fieldId: fetched.field_id,
        fieldName: fetched.fields?.name ?? null,
        createdAt: fetched.created_at,
      });
      setReactions(
        summarizeReactions(fetched.post_reactions ?? [], activeTypes, user?.id),
      );
      setError(null);
    } catch (cause) {
      setError(toUserMessage(cause));
    } finally {
      setLoadingPost(false);
    }
  }, [postId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadPost();
      void reloadComments();
    }, [loadPost, reloadComments]),
  );

  const handleToggleReaction = useCallback(
    async (code: string) => {
      if (!user) return;
      const { next, previousCode, nextCode } = toggleReactionSummary(reactions, code);
      const snapshot = reactions;
      setReactions(next);
      try {
        await setReaction({
          postId,
          userId: user.id,
          previous: previousCode,
          next: nextCode,
        });
      } catch (cause) {
        setReactions(snapshot);
        setActionError(
          cause instanceof Error ? cause.message : 'Не удалось сохранить реакцию.',
        );
      }
    },
    [reactions, user, postId, setReaction],
  );

  const handleSubmitComment = useCallback(
    async (text: string): Promise<boolean> => {
      setSubmitting(true);
      try {
        if (editing) {
          await edit(editing.id, text);
          setEditing(null);
        } else if (replyTo) {
          const rootId = findRootId(comments, replyTo.id);
          await add(text, replyTo.id);
          setExpandedThreads((prev) => new Set(prev).add(rootId));
          setReplyTo(null);
        } else {
          await add(text);
        }
        return true;
      } catch (cause) {
        setActionError(cause instanceof Error ? cause.message : 'Не удалось отправить.');
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [editing, replyTo, edit, add, comments],
  );

  const openFieldOnMap = useCallback(
    (fieldId: string) => {
      navigation.navigate('Tabs', {
        screen: 'Map',
        params: { focusFieldId: fieldId, openCard: true },
      });
    },
    [navigation],
  );

  const openAuthor = useCallback(
    (authorId: string) => {
      if (authorId && authorId === user?.id) {
        navigation.navigate('Tabs', { screen: 'Profile' });
      } else {
        navigation.navigate('UserProfile', { userId: authorId });
      }
    },
    [navigation, user?.id],
  );

  const handleVote = useCallback(
    async (id: string, value: -1 | 1) => {
      try {
        await vote(id, value);
      } catch (cause) {
        setActionError(cause instanceof Error ? cause.message : 'Не удалось сохранить голос.');
      }
    },
    [vote],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await remove(pendingDeleteId);
      if (editing?.id === pendingDeleteId) setEditing(null);
      if (replyTo?.id === pendingDeleteId) setReplyTo(null);
      setPendingDeleteId(null);
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : toUserMessage(cause));
    } finally {
      setDeleting(false);
    }
  }, [pendingDeleteId, remove, editing, replyTo]);

  const terms = post?.postTypeCode === 'question' ? TERMS.question : TERMS.post;
  const fieldId = post?.fieldId ?? null;

  /**
   * `comments` уже сгруппирован по потокам (`useComments` → `orderByThread`):
   * между двумя корнями лежит ровно всё поддерево первого. Здесь только
   * нарезаем каждый такой блок на «первые N / остальное за кнопкой».
   */
  const rows = useMemo<CommentRowView[]>(() => {
    const result: CommentRowView[] = [];
    let i = 0;
    while (i < comments.length) {
      const root = comments[i];
      result.push({ kind: 'comment', comment: root });
      i++;
      if (root.parentId === null && !root.isAi) {
        let j = i;
        while (j < comments.length && comments[j].parentId !== null) j++;
        const replies = comments.slice(i, j);
        const expanded = expandedThreads.has(root.id);
        const visible = expanded ? replies : replies.slice(0, VISIBLE_REPLIES);
        visible.forEach((reply) => result.push({ kind: 'comment', comment: reply }));
        const hidden = replies.length - visible.length;
        if (hidden > 0) result.push({ kind: 'more', rootId: root.id, count: hidden });
        i = j;
      }
    }
    return result;
  }, [comments, expandedThreads]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.root}>
      <AppHeader title="Пост" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loadingPost && !post ? (
          <ActivityIndicator style={styles.loader} />
        ) : error ? (
          <Text style={styles.stateText}>{error}</Text>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {post ? (
              <PostCard
                author={post.author}
                title={post.title}
                description={post.description}
                images={post.images}
                onAuthorPress={() => openAuthor(post.author.id)}
                createdAt={post.createdAt}
                reactions={reactions}
                onToggleReaction={handleToggleReaction}
                commentCount={comments.length}
                fieldName={post.fieldName ?? undefined}
                onMap={fieldId ? () => openFieldOnMap(fieldId) : undefined}
              />
            ) : null}

            <Divider />

            {commentsError ? (
              <Text style={styles.stateText}>{commentsError}</Text>
            ) : null}
            {commentsLoading ? <ActivityIndicator style={styles.loader} /> : null}
            {!commentsLoading && comments.length === 0 ? (
              <Text style={styles.stateText}>{terms.empty}</Text>
            ) : null}

            {rows.map((row) => {
              if (row.kind === 'more') {
                return (
                  <ShowMoreReplies
                    key={`more-${row.rootId}`}
                    count={row.count}
                    onPress={() =>
                      setExpandedThreads((prev) => new Set(prev).add(row.rootId))
                    }
                  />
                );
              }
              const comment = row.comment;
              const authorId = comment.author.id;
              return (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onVote={(value) => handleVote(comment.id, value)}
                  onEdit={() => {
                    setReplyTo(null);
                    setEditing({ id: comment.id, initialText: comment.body });
                  }}
                  onDelete={() => {
                    setDeleteError(null);
                    setPendingDeleteId(comment.id);
                  }}
                  onReply={
                    comment.isAi
                      ? undefined
                      : () => {
                          setEditing(null);
                          setReplyTo({ id: comment.id, authorName: comment.author.nickname });
                        }
                  }
                  onAuthorPress={authorId ? () => openAuthor(authorId) : undefined}
                />
              );
            })}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}

        {post && !error ? (
          <CommentComposer
            editing={editing}
            replyTo={replyTo}
            submitting={submitting}
            placeholder={terms.placeholder}
            submitLabel={terms.submit}
            editingLabel={terms.editingLabel}
            onSubmit={handleSubmitComment}
            onCancelEdit={() => setEditing(null)}
            onCancelReply={() => setReplyTo(null)}
          />
        ) : null}
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={pendingDeleteId !== null}
        title={terms.deleteTitle}
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
        visible={actionError !== null}
        onDismiss={() => setActionError(null)}
        duration={3000}
      >
        {actionError ?? ''}
      </Snackbar>
    </SafeAreaView>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    flex: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingBottom: 12,
    },
    loader: {
      marginTop: 24,
    },
    stateText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      textAlign: 'center',
      marginTop: 24,
      paddingHorizontal: 24,
    },
    bottomSpacer: {
      height: 8,
    },
  });
