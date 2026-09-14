import { z } from 'zod';

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: z.string().min(6, 'Минимум 6 символов'),
    confirmPassword: z.string().min(1, 'Повторите пароль'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Пароли не совпадают',
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const changePasswordDefaults: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};
