import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase';

import type { Credentials } from './authTypes';

/**
 * Тонкие обёртки над supabase.auth. Состояние не трогают — им управляет
 * AuthProvider через onAuthStateChange.
 */

export async function signInWithPassword(credentials: Credentials): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) throw error;
  return data.session;
}

/**
 * Подтверждение почты на бэкенде отключено (`mailer_autoconfirm: true`),
 * поэтому signUp сразу возвращает готовую сессию — писем и кодов нет.
 */
export async function signUpWithPassword(credentials: Credentials): Promise<Session> {
  const { data, error } = await supabase.auth.signUp(credentials);
  if (error) throw error;
  if (!data.session) {
    // Сюда попадём, если на бэкенде снова включат подтверждение почты:
    // пользователь создан, но войти нельзя. Лучше явная ошибка, чем зависший экран.
    throw new Error(
      'Регистрация не завершена: сервер не вернул сессию. ' +
        'Возможно, на бэкенде включили подтверждение почты.',
    );
  }
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Бэкенд не требует текущий пароль для смены — `updateUser` работает на
 * активной сессии. Экран запрашивает его как доп. UX-барьер, поэтому проверяем
 * сами через повторный вход; код ошибки от Supabase здесь неинформативен для
 * пользователя, поэтому кидаем свой текст.
 */
export async function verifyPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Неверный текущий пароль.');
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
