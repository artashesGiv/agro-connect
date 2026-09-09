import { z } from 'zod';

/**
 * Схема мастера создания поста (все шаги в одном объекте). Шаг валидирует только
 * свои поля через `trigger(CREATE_STEP_FIELDS.x)` перед переходом.
 *
 * `postTypeCode` — `code` из справочника `post_types`; бэк требует `post_type_id`,
 * дефолта нет, поэтому тип выбирается на первом шаге. `body` и `photos`
 * необязательны — бэку достаточно `title`.
 */
export const createPostSchema = z.object({
  postTypeCode: z.enum(['field_update', 'question']),
  title: z.string().trim().min(1, 'Введите заголовок'),
  body: z.string().trim().max(4000, 'Слишком длинное описание'),
  photos: z.array(z.object({ uri: z.string(), mimeType: z.string() })),
});

export type CreatePostFormValues = z.infer<typeof createPostSchema>;

export const createPostDefaults: CreatePostFormValues = {
  postTypeCode: 'field_update',
  title: '',
  body: '',
  photos: [],
};

export const CREATE_STEP_FIELDS = {
  title: ['postTypeCode', 'title'],
} as const satisfies Record<string, readonly (keyof CreatePostFormValues)[]>;
