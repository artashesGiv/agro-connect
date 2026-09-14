type Listener = () => void;

const listeners = new Set<Listener>();
const sentListeners = new Set<Listener>();

/**
 * Мини pub/sub, а не Context/Provider: очередь живёт в AsyncStorage, а не в
 * React-состоянии, так что нескольким экземплярам `usePendingPosts` (профиль,
 * главная, вопросы) нужен способ узнать, что кто-то другой её поменял.
 */
export function subscribeQueueChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitQueueChanged(): void {
  listeners.forEach((listener) => listener());
}

/**
 * Отдельно от `queueChanged`: конкретно «пост из очереди успешно опубликован»
 * (не просто удалён из очереди вручную) — на это подписываются `useFeed` и
 * `useUserPosts`, чтобы перечитать настоящую ленту, а не только список самой
 * очереди. Без этого пост, отправленный автоматически в фоне (после
 * восстановления сети, пока пользователь уже сидит на вкладке), появлялся бы
 * в ленте только после ручного pull-to-refresh.
 */
export function subscribePostSent(listener: Listener): () => void {
  sentListeners.add(listener);
  return () => sentListeners.delete(listener);
}

export function emitPostSent(): void {
  sentListeners.forEach((listener) => listener());
}
