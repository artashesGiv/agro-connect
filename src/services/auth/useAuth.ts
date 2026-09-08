import { useContext } from 'react';

import { AuthContext } from './AuthProvider';
import type { AuthContextValue } from './authTypes';

/**
 * Доступ к сессии: `status`, `user`, `error` и действия `signIn` / `signUp` /
 * `signOut`. Любой экран или фича могут импортировать этот хук.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return context;
}
