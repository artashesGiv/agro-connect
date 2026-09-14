export type ExperimentVariant = 'A' | 'B';

/**
 * Детерминированный сплит 50/50 по id пользователя и ключу теста — один и тот
 * же пользователь всегда получает один и тот же вариант на любом устройстве,
 * без обращения к бэкенду. Ключ теста в хэше — чтобы разные A/B тесты для
 * одного пользователя не коррелировали друг с другом.
 */
export function getVariant(userId: string, experimentKey: string): ExperimentVariant {
  const input = `${experimentKey}:${userId}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % 2 === 0 ? 'A' : 'B';
}
