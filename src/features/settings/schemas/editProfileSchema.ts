import { z } from 'zod';

import { isKnownRegion } from '@/constants/regions';

/** Те же поля и правила, что на шаге «О себе» регистрации — колонки `profiles`
 *  не меняются, меняется только то, где их редактируют. */
export const editProfileSchema = z.object({
  name: z.string().trim().min(1, 'Введите имя'),
  specialization: z.string().trim().min(1, 'Укажите специализацию'),
  region: z
    .string()
    .min(1, 'Укажите регион')
    .refine((value): boolean => isKnownRegion(value), { message: 'Укажите регион' }),
});

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;
