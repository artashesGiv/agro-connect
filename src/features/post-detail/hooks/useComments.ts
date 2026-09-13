import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/services/auth';
import { storage, toUserMessage } from '@/services/supabase';

import {
  addComment,
  deleteComment,
  listAiComments,
  listComments,
  setAnswerVote,
  updateComment,
  type AiCommentRow,
  type CommentRow,
} from '../repository/commentsRepository';

/** Отображаемое имя для ответов из `post_comments` — своего профиля у ИИ нет. */
const AI_AUTHOR_NAME = 'ИИ-помощник';

export type Comment = {
  id: string;
  /** `author.id`/`reputation` не заданы у ИИ-комментариев — своего профиля у ИИ нет. */
  author: { id?: string; nickname: string; avatarUrl?: string; reputation?: number };
  body: string;
  createdAt: string;
  /** Задано, если комментарий редактировали. */
  editedAt?: string;
  isMine: boolean;
  isAi: boolean;
  score: number;
  myVote: -1 | 0 | 1;
};

function mapRow(row: CommentRow, viewerId: string | undefined): Comment {
  const score = row.answer_votes.reduce((sum, v) => sum + v.value, 0);
  const mine = viewerId
    ? row.answer_votes.find((v) => v.user_id === viewerId)?.value
    : undefined;
  return {
    id: row.id,
    author: {
      id: row.author_id,
      nickname: row.profiles?.name ?? 'без имени',
      avatarUrl: row.profiles?.avatar_path
        ? storage.getAvatarUrl(row.profiles.avatar_path)
        : undefined,
      reputation: row.profiles?.reputation ?? 0,
    },
    body: row.body,
    createdAt: row.created_at,
    editedAt: row.updated_at !== row.created_at ? row.updated_at : undefined,
    isMine: viewerId ? row.author_id === viewerId : false,
    isAi: false,
    score,
    myVote: mine === 1 ? 1 : mine === -1 ? -1 : 0,
  };
}

/** `post_comments` пока не поддерживает голоса и правки — их пишет только ИИ. */
function mapAiRow(row: AiCommentRow): Comment {
  return {
    id: row.id,
    author: { nickname: AI_AUTHOR_NAME },
    body: row.body,
    createdAt: row.created_at,
    editedAt: row.updated_at !== row.created_at ? row.updated_at : undefined,
    isMine: false,
    isAi: true,
    score: 0,
    myVote: 0,
  };
}

/**
 * Комментарии поста: ручной паттерн `loading/error/reload` + мутации.
 * Голос обновляется оптимистично (частое действие), остальное — через `reload`.
 */
export function useComments(postId: string) {
  const { user } = useAuth();
  const viewerId = user?.id;
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, aiRows] = await Promise.all([
        listComments(postId),
        listAiComments(postId),
      ]);
      const merged = [
        ...rows.map((row) => mapRow(row, viewerId)),
        ...aiRows.map(mapAiRow),
      ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      setComments(merged);
    } catch (cause) {
      setError(toUserMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [postId, viewerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = useCallback(
    async (body: string) => {
      if (!viewerId) throw new Error('Сессия не найдена. Войдите заново.');
      try {
        await addComment(postId, viewerId, body);
      } catch (cause) {
        throw new Error(toUserMessage(cause));
      }
      await load();
    },
    [postId, viewerId, load],
  );

  const edit = useCallback(
    async (id: string, body: string) => {
      try {
        await updateComment(id, body);
      } catch (cause) {
        throw new Error(toUserMessage(cause));
      }
      await load();
    },
    [load],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteComment(id);
      } catch (cause) {
        throw new Error(toUserMessage(cause));
      }
      await load();
    },
    [load],
  );

  const vote = useCallback(
    async (id: string, value: -1 | 1) => {
      if (!viewerId) throw new Error('Сессия не найдена. Войдите заново.');
      const target = comments.find((c) => c.id === id);
      if (!target) return;
      const nextVote: -1 | 0 | 1 = target.myVote === value ? 0 : value;
      const snapshot = comments;
      setComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, myVote: nextVote, score: c.score - c.myVote + nextVote }
            : c,
        ),
      );
      try {
        await setAnswerVote({
          answerId: id,
          userId: viewerId,
          value: nextVote === 0 ? null : nextVote,
        });
      } catch (cause) {
        setComments(snapshot);
        throw new Error(toUserMessage(cause));
      }
    },
    [comments, viewerId],
  );

  return { comments, loading, error, reload: load, add, edit, remove, vote };
}
