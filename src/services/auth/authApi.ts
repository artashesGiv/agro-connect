import { http } from '../http';
import type { Credentials, RegisterPayload, Session } from './authTypes';

// TODO(backend): когда появится реальный API — заменить пути и распарсить
// настоящий ответ ({ token, user }) вместо заглушки ниже.

/**
 * Пока бьём в тестовый JSONPlaceholder только чтобы обкатать сетевой слой.
 * Ответ не используем — возвращаем синтетическую сессию из введённых данных.
 * Реальная ошибка сети/сервера пробрасывается наверх (это и есть поведение,
 * к которому готовимся).
 */
export async function login(credentials: Credentials): Promise<Session> {
  await http.post('/users', credentials, { auth: false });
  return stubSession(credentials.email);
}

export async function register(payload: RegisterPayload): Promise<Session> {
  await http.post('/users', payload, { auth: false });
  return stubSession(payload.email, payload.nickname);
}

// Мок-верификация email. Код не проверяется — принимаем что угодно.
// TODO(backend): реальный флоу — отдельные запросы start / verify / complete.
export async function requestCode(email: string): Promise<void> {
  await http.post('/posts', { email }, { auth: false }).catch(() => {});
}

export async function verifyCode(email: string, code: string): Promise<void> {
  await http.post('/posts', { email, code }, { auth: false }).catch(() => {});
}

function stubSession(email: string, name?: string): Session {
  return {
    token: 'demo-access-token',
    user: {
      id: 'demo-user',
      email,
      name: name ?? email.split('@')[0],
    },
  };
}
