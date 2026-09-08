export type AuthStatus =
  | 'loading' // читаем токен из хранилища при старте
  | 'authenticating' // идёт вход/регистрация
  | 'authenticated'
  | 'unauthenticated';

export type Credentials = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  firstName: string;
  lastName: string;
  nickname: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

/** Что возвращает сервер на вход/регистрацию (после маппинга под наш формат). */
export type Session = {
  token: string;
  user: AuthUser;
};

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  signIn: (credentials: Credentials) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
};
