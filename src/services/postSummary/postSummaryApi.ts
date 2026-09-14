import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase';

/** HTTP-контракт Edge Functions `request-post-summary`/`get-post-summary`
 *  (backend-2) — намеренно отдельно от `database.types.ts`, это не строки БД. */
export type SummaryConfidence = 'high' | 'medium' | 'low';

export type SummaryPoint = { text: string; source_ids: string[] };

export type SummaryAction = { action: string; reason: string; source_ids: string[] };

export type RecommendedSummaryAction = SummaryAction & {
  priority: 'high' | 'medium' | 'low';
};

export type PostSummaryAnalysis = {
  summary: string;
  key_points: SummaryPoint[];
  recommended_actions: RecommendedSummaryAction[];
  avoid_actions: SummaryAction[];
  disagreements: SummaryPoint[];
  missing_information: string[];
  confidence: SummaryConfidence;
};

export type StartPostSummaryResponse = {
  job_id: string;
  post_id: string;
  status: 'queued' | 'processing' | 'completed';
  reused: boolean;
  request_id: string;
};

export type PostSummaryPending = {
  job_id: string;
  post_id: string;
  status: 'queued' | 'processing';
  error: string | null;
  created_at: string;
  request_id: string;
};

export type PostSummaryFailed = {
  job_id: string;
  post_id: string;
  status: 'failed';
  error: string;
  created_at: string;
  request_id: string;
};

export type PostSummaryCompleted = {
  job_id: string;
  post_id: string;
  status: 'completed';
  analysis: PostSummaryAnalysis;
  generated_at: string;
  request_id: string;
};

export type PostSummaryJobResponse =
  | PostSummaryPending
  | PostSummaryFailed
  | PostSummaryCompleted;

const FALLBACK = 'Не удалось выполнить AI-разбор. Попробуйте позже.';

function messageFromBody(body: unknown): string | null {
  if (body && typeof body === 'object' && 'error' in body) {
    const value = (body as { error?: unknown }).error;
    if (typeof value === 'string' && value) return value;
  }
  return null;
}

export async function requestPostSummary(postId: string): Promise<StartPostSummaryResponse> {
  const { data, error } = await supabase.functions.invoke<StartPostSummaryResponse>(
    'request-post-summary',
    { body: { post_id: postId } },
  );
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      if (error.context.status === 429) {
        throw new Error('Слишком много запросов. Попробуйте позже.');
      }
      throw new Error(messageFromBody(body) ?? FALLBACK);
    }
    throw new Error(FALLBACK);
  }
  if (!data) throw new Error(FALLBACK);
  return data;
}

const STATUSES = ['queued', 'processing', 'completed', 'failed'];

function isJobResponse(value: unknown): value is PostSummaryJobResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { status?: unknown }).status === 'string' &&
    STATUSES.includes((value as { status: string }).status)
  );
}

const GET_SUMMARY_ERRORS: Record<number, string> = {
  401: 'Войдите заново, чтобы посмотреть разбор.',
  404: 'Разбор недоступен или пост удалён.',
  429: 'Слишком много запросов. Попробуйте позже.',
};

/** `functions.invoke` не умеет GET с query-параметрами — обычный `fetch`. */
export async function getPostSummary(jobId: string): Promise<PostSummaryJobResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Войдите заново, чтобы посмотреть разбор.');

  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-post-summary?job_id=${encodeURIComponent(jobId)}`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
      },
    });
  } catch {
    throw new Error('Не удалось соединиться с сервером. Проверьте интернет.');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(GET_SUMMARY_ERRORS[response.status] ?? messageFromBody(body) ?? FALLBACK);
  }
  if (!isJobResponse(body)) throw new Error(FALLBACK);
  return body;
}

/** Плоский копируемый текст — без `source_ids`/вложений: резолв в сущности
 *  приложения не строим, это самая трудоёмкая часть исходного задания. */
export function formatSummaryText(analysis: PostSummaryAnalysis): string {
  const parts: string[] = [analysis.summary];

  const section = (title: string, lines: string[]) => {
    if (lines.length === 0) return;
    parts.push(`${title}:\n${lines.map((line) => `• ${line}`).join('\n')}`);
  };

  section(
    'Ключевые моменты',
    analysis.key_points.map((point) => point.text),
  );
  section(
    'Что сделать',
    analysis.recommended_actions.map((item) => `${item.action} — ${item.reason}`),
  );
  section(
    'Чего избегать',
    analysis.avoid_actions.map((item) => `${item.action} — ${item.reason}`),
  );
  section(
    'Разногласия',
    analysis.disagreements.map((point) => point.text),
  );
  section('Недостающие данные', analysis.missing_information);

  return parts.join('\n\n');
}
