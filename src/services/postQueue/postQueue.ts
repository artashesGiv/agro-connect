import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CreatePostInput } from '@/services/posts';

import { emitQueueChanged } from './events';

const STORAGE_KEY = 'queue:pending-posts';

export type PendingPostPhoto = { uri: string; mimeType: string };

export type PendingPost = {
  id: string;
  authorId: string;
  createdAt: string;
  input: CreatePostInput;
  photos: PendingPostPhoto[];
};

async function readAll(): Promise<PendingPost[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingPost[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(items: PendingPost[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  emitQueueChanged();
}

export async function listPendingPosts(authorId?: string): Promise<PendingPost[]> {
  const items = await readAll();
  return authorId ? items.filter((item) => item.authorId === authorId) : items;
}

export async function enqueuePendingPost(
  entry: Omit<PendingPost, 'id' | 'createdAt'>,
): Promise<PendingPost> {
  const post: PendingPost = {
    ...entry,
    id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const items = await readAll();
  await writeAll([...items, post]);
  return post;
}

export async function removePendingPost(id: string): Promise<void> {
  const items = await readAll();
  await writeAll(items.filter((item) => item.id !== id));
}
