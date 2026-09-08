import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import { authToken } from '../http';
import * as authApi from './authApi';
import { tokenStorage } from './tokenStorage';
import type {
  AuthContextValue,
  AuthStatus,
  AuthUser,
  Credentials,
  RegisterPayload,
  Session,
} from './authTypes';

type State = {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
};

type Action =
  | { type: 'RESTORE_DONE'; user: AuthUser | null; authenticated: boolean }
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; user: AuthUser }
  | { type: 'AUTH_ERROR'; error: string }
  | { type: 'SIGNED_OUT' };

const initialState: State = { status: 'loading', user: null, error: null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'RESTORE_DONE':
      return {
        status: action.authenticated ? 'authenticated' : 'unauthenticated',
        user: action.user,
        error: null,
      };
    case 'AUTH_START':
      return { ...state, status: 'authenticating', error: null };
    case 'AUTH_SUCCESS':
      return { status: 'authenticated', user: action.user, error: null };
    case 'AUTH_ERROR':
      return { status: 'unauthenticated', user: null, error: action.error };
    case 'SIGNED_OUT':
      return { status: 'unauthenticated', user: null, error: null };
    default:
      return state;
  }
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Холодный старт: восстанавливаем сессию из токена в SecureStore. Сети не требует.
  useEffect(() => {
    let active = true;
    tokenStorage
      .get()
      .then((token) => {
        if (!active) return;
        if (token) {
          authToken.set(token);
          dispatch({ type: 'RESTORE_DONE', user: null, authenticated: true });
        } else {
          dispatch({ type: 'RESTORE_DONE', user: null, authenticated: false });
        }
      })
      .catch(() => {
        if (active) {
          dispatch({ type: 'RESTORE_DONE', user: null, authenticated: false });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const applySession = useCallback(async (session: Session) => {
    authToken.set(session.token);
    await tokenStorage.set(session.token);
    dispatch({ type: 'AUTH_SUCCESS', user: session.user });
  }, []);

  const signIn = useCallback(
    async (credentials: Credentials) => {
      dispatch({ type: 'AUTH_START' });
      try {
        const session = await authApi.login(credentials);
        await applySession(session);
      } catch (error) {
        dispatch({ type: 'AUTH_ERROR', error: toMessage(error) });
      }
    },
    [applySession],
  );

  const signUp = useCallback(
    async (payload: RegisterPayload) => {
      dispatch({ type: 'AUTH_START' });
      try {
        const session = await authApi.register(payload);
        await applySession(session);
      } catch (error) {
        dispatch({ type: 'AUTH_ERROR', error: toMessage(error) });
      }
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    authToken.clear();
    await tokenStorage.clear();
    dispatch({ type: 'SIGNED_OUT' });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      user: state.user,
      error: state.error,
      signIn,
      signUp,
      signOut,
    }),
    [state, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Не удалось выполнить запрос. Проверьте соединение.';
}
