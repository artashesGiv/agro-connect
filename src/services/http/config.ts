/**
 * Базовый адрес API. Сейчас — тестовый JSONPlaceholder (ответы не используются,
 * только чтобы обкатать сетевой слой). Переопределяется через `.env`:
 * `EXPO_PUBLIC_API_URL=https://api.example.com`.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://jsonplaceholder.typicode.com';

/** Таймаут запроса по умолчанию, мс. */
export const DEFAULT_TIMEOUT_MS = 10_000;
