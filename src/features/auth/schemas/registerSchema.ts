import { z } from 'zod';

/**
 * Схема мастера регистрации (все 4 шага в одном объекте). Каждый шаг валидирует
 * только свои поля через `trigger(REGISTER_STEP_FIELDS.x)` перед переходом.
 */
export const registerSchema = z
  .object({
    email: z.string().trim().min(1, 'Введите email').email('Некорректный email'),
    code: z.string().trim().min(1, 'Введите код'),
    firstName: z.string().trim().min(1, 'Введите имя'),
    lastName: z.string().trim().min(1, 'Введите фамилию'),
    nickname: z.string().trim().min(3, 'Минимум 3 символа'),
    password: z.string().min(6, 'Минимум 6 символов'),
    confirmPassword: z.string().min(1, 'Повторите пароль'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Пароли не совпадают',
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const registerDefaults: RegisterFormValues = {
  email: '',
  code: '',
  firstName: '',
  lastName: '',
  nickname: '',
  password: '',
  confirmPassword: '',
};

export const REGISTER_STEP_FIELDS = {
  email: ['email'],
  code: ['code'],
  profile: ['firstName', 'lastName', 'nickname'],
  password: ['password', 'confirmPassword'],
} as const satisfies Record<string, readonly (keyof RegisterFormValues)[]>;
