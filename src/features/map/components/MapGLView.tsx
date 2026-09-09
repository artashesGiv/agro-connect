import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button, type MD3Theme } from 'react-native-paper';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { useAppTheme } from '@/theme';

import { buildMapHtml, flyToScript, parseMapMessage, type LngLat } from './mapHtml';

/**
 * Ключ MapGL. В отличие от `supabase/client.ts` мы здесь не бросаем исключение
 * при отсутствии ключа: этот экран — вкладка в табах, и падение при импорте
 * уронило бы всё приложение. Показываем состояние ошибки на самой карте.
 */
const MAPGL_KEY = process.env.EXPO_PUBLIC_2GIS_MAPGL_KEY;

/**
 * Origin, с которым страница уходит к 2GIS. Без `baseUrl` документ из
 * `source.html` живёт на `about:blank`, и ключ, ограниченный по домену, будет
 * отклонён. Если ключ привязан к конкретному домену — поменять надо здесь.
 */
const MAPGL_BASE_URL = 'https://localhost';

/** Если карта не сообщила о готовности за это время — считаем, что не взлетела. */
const READY_TIMEOUT_MS = 15000;

export type MapGLViewHandle = {
  /** Перелететь к точке. Вызов до готовности карты запоминается и повторится. */
  flyTo: (center: LngLat, zoom: number) => void;
};

type Status = 'loading' | 'ready' | 'error';

/**
 * Карта 2GIS (MapGL JS API) внутри WebView: спиннер на загрузке, экран ошибки
 * с повтором и императивный `flyTo`. Всё остальное — детали страницы в
 * `mapHtml.ts`.
 */
export const MapGLView = forwardRef<MapGLViewHandle>(function MapGLView(_props, ref) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const webViewRef = useRef<WebView>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Перелёт, заказанный до `styleload`: применим, как только карта готова. */
  const pendingRef = useRef<{ center: LngLat; zoom: number } | null>(null);
  const statusRef = useRef<Status>('loading');

  const [status, setStatus] = useState<Status>(MAPGL_KEY ? 'loading' : 'error');
  // `attempt` пересоздаёт WebView: перезагрузить страницу, у которой не
  // загрузился скрипт MapGL, надёжнее целиком, чем через reload().
  const [attempt, setAttempt] = useState(0);

  const html = useMemo(
    () => (MAPGL_KEY ? buildMapHtml(MAPGL_KEY, theme.colors.background) : ''),
    [theme.colors.background],
  );

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const changeStatus = useCallback(
    (next: Status) => {
      statusRef.current = next;
      setStatus(next);
    },
    [],
  );

  const fail = useCallback(
    (reason: string) => {
      // Ошибки после успешной загрузки игнорируем: MapGL шлёт `error` и на
      // единичный неподъехавший тайл, а карта при этом нарисована и работает.
      if (statusRef.current === 'ready') return;
      if (__DEV__) console.warn('[Карта] ' + reason);
      clearTimer();
      changeStatus('error');
    },
    [changeStatus, clearTimer],
  );

  const flyTo = useCallback((center: LngLat, zoom: number) => {
    if (statusRef.current !== 'ready') {
      pendingRef.current = { center, zoom };
      return;
    }
    webViewRef.current?.injectJavaScript(flyToScript(center, zoom));
  }, []);

  useImperativeHandle(ref, () => ({ flyTo }), [flyTo]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseMapMessage(event.nativeEvent.data);
      if (!message) return;

      if (message.type === 'error') {
        fail(message.message);
        return;
      }

      clearTimer();
      changeStatus('ready');
      const pending = pendingRef.current;
      if (pending) {
        pendingRef.current = null;
        webViewRef.current?.injectJavaScript(flyToScript(pending.center, pending.zoom));
      }
    },
    [changeStatus, clearTimer, fail],
  );

  const handleLoadStart = useCallback(() => {
    clearTimer();
    timeoutRef.current = setTimeout(() => fail('таймаут готовности карты'), READY_TIMEOUT_MS);
  }, [clearTimer, fail]);

  const retry = useCallback(() => {
    pendingRef.current = null;
    clearTimer();
    changeStatus('loading');
    setAttempt((value) => value + 1);
  }, [changeStatus, clearTimer]);

  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Карта не загрузилась</Text>
        <Text style={styles.errorText}>
          {MAPGL_KEY
            ? 'Проверьте подключение к интернету. Если оно есть — возможно, истёк ключ 2GIS.'
            : 'Не задан EXPO_PUBLIC_2GIS_MAPGL_KEY. Скопируйте .env.example в .env и перезапустите dev-сервер.'}
        </Text>
        {MAPGL_KEY ? (
          <Button mode="contained" onPress={retry} style={styles.retry}>
            Повторить
          </Button>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        key={attempt}
        ref={webViewRef}
        source={{ html, baseUrl: MAPGL_BASE_URL }}
        originWhitelist={['https://*']}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onError={() => fail('WebView не смог открыть страницу')}
        onHttpError={() => fail('WebView получил HTTP-ошибку')}
        // WebGL без аппаратного слоя не рисуется.
        androidLayerType="hardware"
        javaScriptEnabled
        domStorageEnabled
        // Скроллить нечего: страница ровно в размер карты, а перехват жестов
        // мешал бы панорамированию.
        scrollEnabled={false}
        overScrollMode="never"
        style={styles.webView}
        containerStyle={styles.webViewContainer}
      />
      {status === 'loading' ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : null}
    </View>
  );
});

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    webView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    webViewContainer: {
      flex: 1,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: theme.colors.background,
    },
    errorTitle: {
      color: theme.colors.onBackground,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
      textAlign: 'center',
    },
    errorText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    retry: {
      marginTop: 20,
    },
  });
