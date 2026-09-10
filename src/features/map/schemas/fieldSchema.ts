import { z } from 'zod';

/**
 * Схема формы нового поля. Одно описание даёт и валидацию, и тип.
 * `name` в БД `not null`, поэтому обязателен и здесь; `region` необязателен —
 * он и в схеме nullable.
 */
export const fieldSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Минимум 2 символа')
    .max(60, 'Не длиннее 60 символов'),
  region: z.string().trim().max(120, 'Не длиннее 120 символов'),
});

export type FieldFormValues = z.infer<typeof fieldSchema>;

/**
 * Значения по умолчанию. Имя подставляем готовое — человек, только что
 * обведший контур, хочет нажать «Сохранить», а не придумывать название.
 * Регион берём из профиля: он там уже указан, незачем спрашивать снова.
 */
export function fieldDefaults(fieldCount: number, region: string | null): FieldFormValues {
  return {
    name: `Поле ${fieldCount + 1}`,
    region: region ?? '',
  };
}
