import type { Post } from './postTypes';

// Моковые посты «текущего пользователя». Когда появится реальный API, автор и
// содержимое будут приходить из ответа — см. TODO(backend) в postsApi.ts.
const AUTHOR = { nickname: 'agronom' };

export const MOCK_USER_POSTS: Post[] = [
  {
    id: 'p1',
    author: AUTHOR,
    title: 'Первый осмотр озимой пшеницы',
    description:
      'Всходы дружные, но по краю поля заметил признаки нехватки азота. ' +
      'Планирую подкормку на следующей неделе.',
    images: ['https://picsum.photos/seed/agro-wheat/600/450'],
    likeCount: 12,
    commentCount: 3,
    bookmarked: false,
    createdAt: '2026-09-01',
  },
  {
    id: 'p2',
    author: AUTHOR,
    title: 'Купили новый опрыскиватель',
    description: 'Наконец-то заменили старый. Первые впечатления отличные.',
    images: ['https://picsum.photos/seed/agro-sprayer/600/450'],
    likeCount: 27,
    commentCount: 8,
    bookmarked: true,
    createdAt: '2026-08-27',
  },
  {
    // Минимальный пост — только обязательные поля (проверка опциональных пропсов).
    id: 'p3',
    author: AUTHOR,
    title: 'Заметка: проверить дренаж на южном участке',
  },
];
