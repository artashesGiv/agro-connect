export type PostAuthor = {
  nickname: string;
  avatarUrl?: string;
};

export type Post = {
  id: string;
  author: PostAuthor;
  title: string;
  description?: string;
  /** Пока рисуем только `images[0]`; в будущем — слайдер из нескольких фото. */
  images?: string[];
  likeCount?: number;
  commentCount?: number;
  bookmarked?: boolean;
  createdAt?: string;
};
