import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAuth } from '@/services/auth';
import {
  getNotifications,
  markNotificationRead,
  type NotificationRow,
} from '@/services/notifications';

const POLL_INTERVAL_MS = 5000;
const BANNER_VISIBLE_MS = 2500;

type NotificationsContextValue = {
  notifications: NotificationRow[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markRead: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
  /** Появился хотя бы один новый непрочитанный с прошлого опроса. */
  bannerVisible: boolean;
  dismissBanner: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

/**
 * Без Realtime/push: каждые 5с опрашиваем `notifications`, пока пользователь
 * авторизован и есть сеть. Список — источник истины и для бейджа на
 * колокольчике, и для баннера «Новое уведомление».
 *
 * Монтируется между `AuthProvider` и `RootNavigator` в `App.tsx` — баннер
 * рисуется в `RootNavigator` (глобально, поверх любой вкладки), а
 * колокольчик в профиле лежит глубоко внутри `AppNavigator`; обоим нужен
 * один и тот же стейт.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const isOnline = useNetworkStatus();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);

  /** Id уже виденных уведомлений — по ним отличаем «новое» от «уже показывали». */
  const seenIdsRef = useRef<Set<string> | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissBanner = useCallback(() => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setBannerVisible(false);
  }, []);

  const fetchOnce = useCallback(async () => {
    try {
      const rows = await getNotifications();
      setError(null);

      const seen = seenIdsRef.current;
      if (seen) {
        // Не первый опрос в этой сессии — реально новые записи запускают баннер.
        const hasNew = rows.some((row) => !row.read_at && !seen.has(row.id));
        if (hasNew) {
          setBannerVisible(true);
          if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
          bannerTimerRef.current = setTimeout(() => setBannerVisible(false), BANNER_VISIBLE_MS);
        }
      }
      seenIdsRef.current = new Set(rows.map((row) => row.id));

      setNotifications(rows);
    } catch (cause) {
      // Один неудачный тик не должен убирать уже показанный список.
      setError(cause instanceof Error ? cause.message : 'Не удалось загрузить уведомления.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') {
      // Вышли из аккаунта — состояние следующего входа не должно быть чужим.
      seenIdsRef.current = null;
      setNotifications([]);
      setLoading(true);
      return;
    }
    if (!isOnline) return;

    void fetchOnce();
    const id = setInterval(() => void fetchOnce(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [status, isOnline, fetchOnce]);

  useEffect(() => () => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
  }, []);

  const markRead = useCallback(async (id: string) => {
    const snapshot = notifications;
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read_at: new Date().toISOString() } : item)),
    );
    try {
      await markNotificationRead(id);
    } catch (cause) {
      setNotifications(snapshot);
      throw cause instanceof Error ? cause : new Error('Не удалось отметить прочитанным.');
    }
  }, [notifications]);

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        markRead,
        refetch: fetchOnce,
        bannerVisible,
        dismissBanner,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const value = useContext(NotificationsContext);
  if (!value) throw new Error('useNotifications must be used within NotificationsProvider');
  return value;
}
