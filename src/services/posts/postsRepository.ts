import { dictionaries, storage, supabase } from '@/services/supabase';
import type { PostMediaMimeType } from '@/services/supabase/storage';
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
  /** Только посты этого автора — для вкладки «Мои посты» / чужого профиля. */
  authorId?: string;
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
  if (filter.authorId) query = query.eq('author_id', filter.authorId);
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

export type NewPostPhoto = { uri: string; mimeType: string };

export type CreatePostInput = {
  /** `code` из справочника post_types: 'field_update' | 'question'. */
  postTypeCode: string;
  title?: string | null;
  body?: string | null;
};

/** Приводим MIME из пикера к тому, что принимает бакет `post-media`. */
function resolvePostMediaMime(mime?: string): PostMediaMimeType {
  const value = (mime ?? 'image/jpeg') as PostMediaMimeType;
  if (!storage.POST_MEDIA_MIME_TYPES.includes(value)) {
    throw new Error('Формат файла не поддерживается');
  }
  return value;
}

/**
 * Создать пост вместе с медиа. Операция НЕ атомарна: сначала создаём пост,
 * потом грузим файлы и пишем `post_media`. Если медиа-часть падает — откатываем
 * пост (`deletePost`), чтобы не осталось «пустого» поста без обещанных фото.
 * Возвращает id созданного поста.
 */
export async function createPostWithMedia(
  authorId: string,
  input: CreatePostInput,
  photos: NewPostPhoto[],
): Promise<string> {
  const types = await dictionaries.getPostTypes();
  const type = types.find((t) => t.code === input.postTypeCode);
  if (!type) throw new Error('Неизвестный тип поста');

  const post = await createPost(authorId, {
    post_type_id: type.id,
    title: input.title?.trim() || null,
    body: input.body?.trim() || null,
  });

  if (photos.length === 0) return post.id;

  try {
    const rows: TablesInsert<'post_media'>[] = [];
    for (let i = 0; i < photos.length; i += 1) {
      const contentType = resolvePostMediaMime(photos[i].mimeType);
      const storagePath = await storage.uploadPostMedia(
        authorId,
        photos[i].uri,
        contentType,
      );
      rows.push({
        post_id: post.id,
        media_type: contentType.startsWith('video') ? 'video' : 'image',
        storage_path: storagePath,
        sort_order: i,
      });
    }
    const { error } = await supabase.from('post_media').insert(rows);
    if (error) throw error;
  } catch (cause) {
    await deletePost(post.id).catch(() => {});
    throw cause;
  }

  return post.id;
}
