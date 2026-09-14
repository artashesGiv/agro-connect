import { useMemo } from 'react';

import { useAuth } from '@/services/auth';
import { getVariant, type ExperimentVariant } from '@/utils/experiments';

/**
 * Группа A/B для текущего пользователя в конкретном тесте. Пока сессия ещё
 * не восстановлена (`user` — `null`) отдаём `'A'` — это сегодняшнее поведение
 * по умолчанию, безопасный фолбэк.
 */
export function useExperimentVariant(experimentKey: string): ExperimentVariant {
  const { user } = useAuth();
  return useMemo(
    () => (user ? getVariant(user.id, experimentKey) : 'A'),
    [user, experimentKey],
  );
}
