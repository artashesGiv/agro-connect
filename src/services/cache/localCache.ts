import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'cache:';

/**
 * Минимальный JSON-кэш поверх AsyncStorage: последний успешный ответ сервера,
 * чтобы было что показать без сети. Не react-query — намеренно: кэшу нужно
 * закрыть ровно два места (`useFields`, `useFeed`), полноценный слой с
 * инвалидацией/фоновыми рефетчами был бы избыточен для этой задачи.
 */
export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Диск/AsyncStorage недоступны — не критично, просто не будет офлайн-фолбэка.
  }
}
