import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  createPostDefaults,
  createPostSchema,
  type CreatePostFormValues,
} from '../schemas/createPostSchema';

/**
 * Один `useForm` на весь мастер создания поста. Экраны шагов берут форму через
 * `useFormContext<CreatePostFormValues>()`. Живёт внутри вкладки «Создать»
 * (не в App.tsx) — как `RegisterFormProvider` для регистрации.
 */
export function CreatePostProvider({ children }: { children: ReactNode }) {
  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: createPostDefaults,
    mode: 'onTouched',
  });

  return <FormProvider {...form}>{children}</FormProvider>;
}
