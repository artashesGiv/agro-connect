/**
 * Синхронный держатель access-токена в памяти на текущий сеанс.
 *
 * Зачем отдельно от контекст-стора и от SecureStore:
 * - `httpClient` вызывается вне React и должен читать токен синхронно на каждый запрос;
 * - SecureStore асинхронный и медленный для этого;
 * - реактивный стор (`AuthProvider`) нельзя читать из обычной функции.
 *
 * Пишет сюда только `AuthProvider` (дублирует токен при входе/выходе).
 */
let currentToken: string | null = null;

export const authToken = {
  get(): string | null {
    return currentToken;
  },
  set(token: string): void {
    currentToken = token;
  },
  clear(): void {
    currentToken = null;
  },
};
