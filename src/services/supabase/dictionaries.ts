import type { Tables } from '@/types/database.types';

import { supabase } from './client';

export type PostType = Tables<'post_types'>;
export type PostStage = Tables<'post_stages'>;
export type PostStatus = Tables<'post_statuses'>;
export type ReactionType = Tables<'reaction_types'>;
export type Crop = Tables<'crops'>;

/**
 * Справочники. Лежат в services, а не в фиче: типы/стадии/статусы нужны и ленте,
 * и созданию поста, и фильтрам. В UI сопоставляем по `code`, а не по ID —
 * ID могут разъехаться между окружениями.
 */

export async function getPostTypes(): Promise<PostType[]> {
  const { data, error } = await supabase.from('post_types').select('*').order('id');
  if (error) throw error;
  return data;
}

export async function getPostStages(): Promise<PostStage[]> {
  const { data, error } = await supabase
    .from('post_stages')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function getPostStatuses(): Promise<PostStatus[]> {
  const { data, error } = await supabase.from('post_statuses').select('*').order('id');
  if (error) throw error;
  return data;
}

export async function getReactionTypes(): Promise<ReactionType[]> {
  const { data, error } = await supabase.from('reaction_types').select('*').order('id');
  if (error) throw error;
  return data;
}

let activeReactionTypesCache: ReactionType[] | null = null;

/**
 * Активные типы реакций в порядке справочника. Кэш на сессию — справочник
 * практически неизменен, а сводка реакций строится на каждый рендер ленты.
 * `getReactionTypes` сам `is_active` не фильтрует, поэтому фильтруем здесь.
 */
export async function getActiveReactionTypes(): Promise<ReactionType[]> {
  if (!activeReactionTypesCache) {
    activeReactionTypesCache = (await getReactionTypes()).filter((t) => t.is_active);
  }
  return activeReactionTypesCache;
}

/** TODO(backend): таблица `crops` пока пустая — список вернётся пустым. */
export async function getCrops(): Promise<Pick<Crop, 'id' | 'slug' | 'name'>[]> {
  const { data, error } = await supabase
    .from('crops')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data;
}
