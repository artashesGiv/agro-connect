import { http } from '../http';
import { MOCK_USER_POSTS } from './mockPosts';
import type { Post } from './postTypes';

// TODO(backend): заменить на реальный `GET /users/:id/posts` и распарсить ответ.
// Сейчас — фейковый запрос (обкатать сетевой слой), ответ игнорируем, отдаём моки.
// Ошибку глушим, чтобы демо работало и оффлайн.
export async function fetchUserPosts(userId?: string): Promise<Post[]> {
  await http
    .get(`/posts?userId=${userId ?? 1}`, { auth: false })
    .catch(() => {});
  return MOCK_USER_POSTS;
}
