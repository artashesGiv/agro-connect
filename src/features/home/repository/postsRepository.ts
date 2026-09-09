import { supabase } from '@/services/supabase';
import type { TablesInsert } from '@/types/database.types';

/**
 * Лента постов. Запрос повторяет структуру из документации бэкенда:
 * один select с join'ами вместо N дополнительных запросов на экран.
 */
/**
 * `!inner` ставится только когда по этой связи реально фильтруем: в PostgREST
 * условие на вложенную таблицу без inner-join не отсекает родительские строки,
 * а лишь обнуляет вложенный объект — лента бы вернула «все посты», где у части
 * post_types === null.
 */
const feedSelect = (innerPostType: boolean) => `
  id,
  title,
  body,
  created_at,
  field_id,
  profiles!posts_author_id_fkey (
    id,
    name,
    specialization,
    region,
    avatar_path,
    reputation
  ),
  crops (
    id,
    slug,
    name
  ),
  post_types${innerPostType ? '!inner' : ''} (
    code,
    name
  ),
  post_stages (
    code,
    name
  ),
  post_statuses (
    code,
    name
  ),
  post_media (
    id,
    media_type,
    storage_path,
    sort_order
  )
`;

export type FeedPost = {
  id: string;
  title: string | null;
  body: string | null;
  created_at: string;
  field_id: string | null;
  profiles: {
    id: string;
    name: string | null;
    specialization: string | null;
    region: string | null;
    avatar_path: string | null;
    reputation: number;
  } | null;
  crops: { id: number; slug: string; name: string } | null;
  post_types: { code: string; name: string } | null;
  post_stages: { code: string; name: string } | null;
  post_statuses: { code: string; name: string } | null;
  post_media: {
    id: string;
    media_type: string;
    storage_path: string;
    sort_order: number;
  }[];
};

export type FeedFilter = {
  /** crops.id — целое число, а не uuid. */
  cropId?: number;
  fieldId?: string;
  /** `code` из справочника post_types, например 'question'. */
  postTypeCode?: string;
  limit?: number;
  /** Для пагинации: отдаём посты старше этой даты. */
  before?: string;
};

export async function getFeed(filter: FeedFilter = {}): Promise<FeedPost[]> {
  let query = supabase
    .from('posts')
    .select(feedSelect(Boolean(filter.postTypeCode)))
    .order('created_at', { ascending: false })
    .limit(filter.limit ?? 20);

  if (filter.cropId) query = query.eq('crop_id', filter.cropId);
  if (filter.fieldId) query = query.eq('field_id', filter.fieldId);
  if (filter.postTypeCode) query = query.eq('post_types.code', filter.postTypeCode);
  if (filter.before) query = query.lt('created_at', filter.before);

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as FeedPost[];
}

export async function getPost(id: string): Promise<FeedPost | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(feedSelect(false))
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as FeedPost | null;
}

export type NewPost = Omit<TablesInsert<'posts'>, 'author_id'>;

/** RLS требует author_id = auth.uid(); если задан field_id — поле должно быть своим. */
export async function createPost(authorId: string, post: NewPost) {
  const { data, error } = await supabase
    .from('posts')
    .insert({ ...post, author_id: authorId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}
