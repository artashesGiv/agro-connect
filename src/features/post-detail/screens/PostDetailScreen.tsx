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

import { CommentComposer, type ComposerEditing } from '../components/CommentComposer';
import { CommentItem } from '../components/CommentItem';
import { useComments } from '../hooks/useComments';

type PostView = {
  author: { nickname: string; avatarUrl?: string };
  title: string;
  description?: string;
  images: string[];
  postTypeCode: string;
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
          nickname: fetched.profiles?.name ?? 'без имени',
          avatarUrl: fetched.profiles?.avatar_path
            ? storage.getAvatarUrl(fetched.profiles.avatar_path)
            : undefined,
        },
        title: fetched.title ?? 'Без заголовка',
        description: fetched.body ?? undefined,
        images: media
          .map((m) => urls[m.storage_path])
          .filter((u): u is string => Boolean(u)),
        postTypeCode: fetched.post_types?.code ?? 'field_update',
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
    [editing, edit, add],
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
      setPendingDeleteId(null);
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : toUserMessage(cause));
    } finally {
      setDeleting(false);
    }
  }, [pendingDeleteId, remove, editing]);

  const terms = post?.postTypeCode === 'question' ? TERMS.question : TERMS.post;

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
                reactions={reactions}
                onToggleReaction={handleToggleReaction}
                commentCount={comments.length}
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

            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onVote={(value) => handleVote(comment.id, value)}
                onEdit={() => setEditing({ id: comment.id, initialText: comment.body })}
                onDelete={() => {
                  setDeleteError(null);
                  setPendingDeleteId(comment.id);
                }}
              />
            ))}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}

        {post && !error ? (
          <CommentComposer
            editing={editing}
            submitting={submitting}
            placeholder={terms.placeholder}
            submitLabel={terms.submit}
            editingLabel={terms.editingLabel}
            onSubmit={handleSubmitComment}
            onCancelEdit={() => setEditing(null)}
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
