import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button, type MD3Theme } from 'react-native-paper';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { useAppTheme } from '@/theme';

import {
  buildMapHtml,
  cancelDrawingScript,
  editPolygonScript,
  finishPolygonScript,
  flyToScript,
  invalidateSizeScript,
  loadDrawingScript,
  parseMapMessage,
  requestCenterScript,
  restartPolygonScript,
  setEditInteractionScript,
  setFieldTapsScript,
  setFieldsScript,
  startPolygonScript,
  undoScript,
  type FieldShape,
  type LngLat,
  type MapMessage,
  type MapPalette,
} from './mapHtml';

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
  /** Перелететь к точке. Вызовы до готовности карты применяются после неё. */
  flyTo: (center: LngLat, zoom: number) => void;
  /** Запросить центр карты — ответ придёт сообщением `center`. */
  requestCenter: () => void;
  /** Заставить карту перемерить контейнер. */
  invalidateSize: () => void;
  /** Перерисовать сохранённые поля. */
  setFields: (shapes: FieldShape[]) => void;
  /** Включить или выключить реакцию на тап по сохранённому полю. */
  setFieldTaps: (enabled: boolean) => void;
  /** Лениво подтянуть рисовалку — ответ придёт `drawing-ready` / `drawing-error`. */
  loadDrawing: () => void;
  startPolygon: () => void;
  /** Загрузить существующий контур в редактор — правка координат поля. */
  editPolygon: (ring: LngLat[]) => void;
  /** Стереть контур и вернуться в фазу рисования. */
  restartPolygon: () => void;
  undo: () => void;
  /** Забрать нарисованный контур — ответ `polygon` / `polygon-invalid`. */
  finishPolygon: () => void;
  cancelDrawing: () => void;
  /** Тумблер фазы правки: жесты вершинам (`true`) или карте (`false`). */
  setEditInteraction: (editing: boolean) => void;
};

type MapGLViewProps = {
  /** События страницы, кроме готовности и фатальных ошибок — их держим внутри. */
  onEvent?: (message: MapMessage) => void;
};

type Status = 'loading' | 'ready' | 'error';

/**
 * Карта 2GIS (MapGL JS API) внутри WebView: спиннер на загрузке, экран ошибки
 * с повтором и императивные команды странице. Всё остальное — детали страницы
 * в `mapHtml.ts`.
 */
export const MapGLView = forwardRef<MapGLViewHandle, MapGLViewProps>(function MapGLView(
  { onEvent },
  ref,
) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const webViewRef = useRef<WebView>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Команды, заказанные до `styleload`. Ключ — имя команды, поэтому повторный
   * заказ вытесняет предыдущий: два перелёта подряд не превратятся в два
   * перелёта после готовности.
   */
  const pendingRef = useRef(new Map<string, string>());
  const statusRef = useRef<Status>('loading');

  const [status, setStatus] = useState<Status>(MAPGL_KEY ? 'loading' : 'error');
  // `attempt` пересоздаёт WebView: перезагрузить страницу, у которой не
  // загрузился скрипт MapGL, надёжнее целиком, чем через reload().
  const [attempt, setAttempt] = useState(0);

  const palette: MapPalette = useMemo(
    () => ({
      background: theme.colors.background,
      // Заливка полупрозрачная: под полем должна оставаться видна карта.
      fieldFill: `${theme.colors.primary}33`,
      fieldStroke: theme.colors.primary,
      pointFill: theme.colors.primary,
      pointStroke: theme.colors.onPrimary,
    }),
    [theme.colors.background, theme.colors.onPrimary, theme.colors.primary],
  );

  const html = useMemo(
    () => (MAPGL_KEY ? buildMapHtml(MAPGL_KEY, palette) : ''),
    [palette],
  );

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const changeStatus = useCallback((next: Status) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  /**
   * @param fatal карта нерабочая независимо от того, успела ли она загрузиться.
   * Без этого флага потеря WebGL-контекста или истёкший ключ давали пустой
   * бежевый прямоугольник без единого следа: экран ошибки не показывался,
   * потому что `ready` уже прошёл.
   */
  const fail = useCallback(
    (reason: string, fatal = false) => {
      if (__DEV__) console.warn('[Карта] ' + reason);
      // Не фатальные ошибки после загрузки игнорируем: MapGL шлёт `error` и на
      // единичный неподъехавший тайл, а карта при этом нарисована и работает.
      if (statusRef.current === 'ready' && !fatal) return;
      clearTimer();
      changeStatus('error');
    },
    [changeStatus, clearTimer],
  );

  /** Выполняет команду сразу или откладывает до готовности карты. */
  const run = useCallback((command: string, script: string) => {
    if (statusRef.current !== 'ready') {
      pendingRef.current.set(command, script);
      return;
    }
    webViewRef.current?.injectJavaScript(script);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (center, zoom) => run('flyTo', flyToScript(center, zoom)),
      requestCenter: () => run('requestCenter', requestCenterScript()),
      invalidateSize: () => run('invalidateSize', invalidateSizeScript()),
      setFields: (shapes) => run('setFields', setFieldsScript(shapes)),
      setFieldTaps: (enabled) => run('setFieldTaps', setFieldTapsScript(enabled)),
      loadDrawing: () => run('loadDrawing', loadDrawingScript()),
      startPolygon: () => run('startPolygon', startPolygonScript()),
      editPolygon: (ring) => run('editPolygon', editPolygonScript(ring)),
      restartPolygon: () => run('restartPolygon', restartPolygonScript()),
      undo: () => run('undo', undoScript()),
      finishPolygon: () => run('finishPolygon', finishPolygonScript()),
      cancelDrawing: () => run('cancelDrawing', cancelDrawingScript()),
      setEditInteraction: (editing) =>
        run('setEditInteraction', setEditInteractionScript(editing)),
    }),
    [run],
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseMapMessage(event.nativeEvent.data);
      if (!message) return;

      if (message.type === 'error') {
        fail(message.message, message.fatal);
        return;
      }

      if (message.type === 'warning') {
        // Единичные сбои страницы: карта работает, но в Metro о них знать надо.
        if (__DEV__) console.warn('[Карта] ' + message.message);
        return;
      }

      if (message.type !== 'ready') {
        onEvent?.(message);
        return;
      }

      clearTimer();
      changeStatus('ready');
      const pending = pendingRef.current;
      pendingRef.current = new Map();
      for (const script of pending.values()) {
        webViewRef.current?.injectJavaScript(script);
      }
    },
    [changeStatus, clearTimer, fail, onEvent],
  );

  const handleLoadStart = useCallback(() => {
    clearTimer();
    timeoutRef.current = setTimeout(() => fail('таймаут готовности карты'), READY_TIMEOUT_MS);
  }, [clearTimer, fail]);

  const retry = useCallback(() => {
    pendingRef.current = new Map();
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
