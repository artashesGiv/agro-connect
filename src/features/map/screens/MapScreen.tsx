import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { Button, IconButton, type MD3Theme, Menu, Snackbar, Surface } from 'react-native-paper';

import { Icon } from '@/components/Icon';
import { useAuth } from '@/services/auth';
import { toUserMessage } from '@/services/supabase';
import { useAppTheme } from '@/theme';

import { FieldFormDialog } from '../components/FieldFormDialog';
import { MapGLView, type MapGLViewHandle } from '../components/MapGLView';
import { USER_ZOOM, type LngLat, type MapMessage } from '../components/mapHtml';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { useFields } from '../hooks/useFields';
import { createField, type Coordinates } from '../repository/fieldsRepository';
import { fieldDefaults, type FieldFormValues } from '../schemas/fieldSchema';

/**
 * Показываем предупреждение о неудачной геолокации один раз за запуск
 * приложения: вкладку открывают часто, и снекбар на каждый заход раздражал бы
 * сильнее, чем сама Москва вместо своего города.
 */
let warnedThisSession = false;

/**
 * `idle` — обычная карта. Остальные три — фазы создания поля:
 * `point` — прицел в центре экрана;
 * `drawing` — тап ставит вершину, протяжка панорамирует карту;
 * `editing` — контур замкнут, создать второй нечем, вершины можно править.
 */
type Mode = 'idle' | 'point' | 'drawing' | 'editing';

/** Геометрия, уже нарисованная, но ещё не сохранённая. */
type Draft = { center: Coordinates } | { boundary: Coordinates[] };

/**
 * Вкладка «Карта»: карта 2GIS, свои поля на ней и создание новых.
 *
 * При появлении вкладки камера едет на местоположение пользователя, а список
 * полей перезагружается. Если местоположения нет, карта остаётся там, где
 * открылась (Москва, обзорный зум) — уводить туда камеру повторно не нужно,
 * это только сбрасывало бы то, что человек рассматривал.
 *
 * Верхние отступы даёт шапка вкладки (`headerShown: true` в `MainTabs`),
 * поэтому обёртка `Screen` здесь не нужна.
 */
export default function MapScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { user, profile } = useAuth();
  const mapRef = useRef<MapGLViewHandle>(null);
  const { locate } = useCurrentLocation();
  const { fields, error: fieldsError, reload } = useFields();

  const [mode, setMode] = useState<Mode>('idle');
  const [menuVisible, setMenuVisible] = useState(false);
  const [preparingDrawing, setPreparingDrawing] = useState(false);
  const [locating, setLocating] = useState(false);
  /** Тумблер фазы правки: `true` — жесты уходят вершинам, `false` — карте. */
  const [editingVertices, setEditingVertices] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  // Читаем режим из колбэков, не пересоздавая их при каждом переключении.
  const modeRef = useRef<Mode>('idle');
  modeRef.current = mode;

  const goToUser = useCallback(async () => {
    setLocating(true);
    try {
      const outcome = await locate((center) => {
        mapRef.current?.flyTo(center, USER_ZOOM);
      });
      if (outcome !== 'ok' && !warnedThisSession) {
        warnedThisSession = true;
        setSnack('Не удалось определить местоположение');
      }
    } finally {
      setLocating(false);
    }
  }, [locate]);

  // Вкладка смонтирована с самого старта приложения (`lazy: false`), поэтому
  // поля тянем сразу при монтировании — к моменту перехода они уже на карте.
  const loadedOnMountRef = useRef(false);
  useEffect(() => {
    loadedOnMountRef.current = true;
    void reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      // Первый фокус пропускаем: эффект монтирования уже сходил за полями,
      // и второй запрос подряд был бы просто лишним.
      if (loadedOnMountRef.current) {
        loadedOnMountRef.current = false;
      } else {
        void reload();
      }
      // Во время создания камеру не трогаем: незаконченный контур уехал бы
      // за экран.
      if (modeRef.current === 'idle') void goToUser();
    }, [goToUser, reload]),
  );

  // Полигоны и одиночные точки страница рисует по-разному, поэтому делим здесь.
  useEffect(() => {
    const polygons: LngLat[][] = [];
    const points: LngLat[] = [];
    for (const field of fields) {
      if (field.boundary) {
        polygons.push(field.boundary.map((point) => [point.longitude, point.latitude]));
      } else if (field.center) {
        points.push([field.center.longitude, field.center.latitude]);
      }
    }
    mapRef.current?.setFields(polygons, points);
  }, [fields]);

  const stopDrawing = useCallback(() => {
    mapRef.current?.cancelDrawing();
    setMode('idle');
    setEditingVertices(false);
    setDraft(null);
    setSaveError(null);
  }, []);

  // Системная кнопка «назад» на Android выходит из режима создания, а не из
  // приложения — иначе выйти из него можно было бы только кнопкой «Отмена».
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (modeRef.current === 'idle') return false;
        stopDrawing();
        return true;
      });
      return () => subscription.remove();
    }, [stopDrawing]),
  );

  const startPolygonMode = useCallback(() => {
    setPreparingDrawing(true);
    mapRef.current?.loadDrawing();
  }, []);

  const restart = useCallback(() => {
    mapRef.current?.restartPolygon();
    setMode('drawing');
    setEditingVertices(false);
  }, []);

  const toggleVertexEditing = useCallback(() => {
    // Побочный эффект намеренно снаружи updater'а: React вызывает updater
    // дважды в dev, и инъекция скрипта уехала бы в WebView два раза.
    const next = !editingVertices;
    setEditingVertices(next);
    mapRef.current?.setEditInteraction(next);
  }, [editingVertices]);

  const handleMapEvent = useCallback((message: MapMessage) => {
    switch (message.type) {
      case 'center':
        setDraft({
          center: { longitude: message.center[0], latitude: message.center[1] },
        });
        break;
      case 'contour-closed':
        setMode('editing');
        // Входим в правку с жестами у карты: так фаза не начинается с
        // сюрприза «карта не двигается».
        setEditingVertices(false);
        mapRef.current?.setEditInteraction(false);
        break;
      case 'polygon':
        setDraft({
          boundary: message.ring.map(([longitude, latitude]) => ({ longitude, latitude })),
        });
        break;
      case 'polygon-invalid':
        setSnack('Поставьте хотя бы три точки');
        break;
      case 'drawing-ready':
        setPreparingDrawing(false);
        setMode('drawing');
        mapRef.current?.startPolygon();
        break;
      case 'drawing-error':
        setPreparingDrawing(false);
        // Пользователю причина ни о чём не скажет, а в Metro она нужна: сюда
        // приходит и «скрипт не загрузился», и «CDN отдал не тот MIME».
        if (__DEV__) console.warn('[Карта] рисовалка: ' + message.message);
        setSnack('Не удалось загрузить инструмент рисования');
        break;
      default:
        break;
    }
  }, []);

  const handleSave = useCallback(
    async (values: FieldFormValues) => {
      if (!draft) return;
      if (!user) {
        // Вкладка живёт за гейтом авторизации, так что сюда не попасть; но
        // молча ничего не делать по нажатию «Сохранить» — худший из исходов.
        setSaveError('Сессия не найдена. Войдите заново.');
        return;
      }
      setSaving(true);
      setSaveError(null);
      try {
        await createField(user.id, {
          name: values.name,
          region: values.region.length > 0 ? values.region : null,
          center: 'center' in draft ? draft.center : null,
          boundary: 'boundary' in draft ? draft.boundary : null,
        });
        stopDrawing();
        setSnack('Поле сохранено');
        await reload();
      } catch (cause) {
        // Нарисованное намеренно не сбрасываем: обводить поле заново из-за
        // пропавшей сети — худшее, что можно предложить.
        setSaveError(toUserMessage(cause));
      } finally {
        setSaving(false);
      }
    },
    [draft, reload, stopDrawing, user],
  );

  // Раньше `error` из `useFields` не использовался нигде: неудачная загрузка
  // выглядела как «полей нет», и отличить одно от другого было невозможно.
  useEffect(() => {
    if (fieldsError) setSnack(fieldsError);
  }, [fieldsError]);

  // Мемоизируем: `FieldFormDialog` сбрасывает форму при смене `defaults`, и
  // новый объект на каждый рендер затирал бы то, что пользователь печатает.
  const formDefaults = useMemo(
    () => fieldDefaults(fields.length, profile?.region ?? null),
    [fields.length, profile?.region],
  );

  const creating = mode !== 'idle';

  return (
    <View style={styles.container}>
      <MapGLView ref={mapRef} onEvent={handleMapEvent} />

      {mode === 'point' ? (
        <View style={styles.crosshair} pointerEvents="none">
          <Icon name="crosshairs" size={40} color={theme.colors.primary} />
        </View>
      ) : null}

      {creating ? (
        <View style={styles.bottomBar} pointerEvents="box-none">
          <Surface style={styles.hint} elevation={2}>
            <Text style={styles.hintText}>{hintFor(mode, editingVertices)}</Text>
          </Surface>

          <Surface style={styles.panel} elevation={3}>
            <Button onPress={stopDrawing} compact>
              Отмена
            </Button>

            {mode === 'drawing' ? (
              <Button onPress={() => mapRef.current?.undo()} compact>
                Шаг назад
              </Button>
            ) : null}

            {mode === 'editing' ? (
              <>
                <Button onPress={restart} compact>
                  Начать заново
                </Button>
                <IconButton
                  // Состояние тумблера должно быть видно без чтения иконки,
                  // поэтому меняем не только глиф, но и заливку.
                  icon={editingVertices ? 'vector-square-edit' : 'cursor-move'}
                  mode="contained"
                  size={20}
                  containerColor={
                    editingVertices ? theme.colors.primary : theme.colors.surfaceVariant
                  }
                  iconColor={
                    editingVertices ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
                  }
                  onPress={toggleVertexEditing}
                  accessibilityLabel={
                    editingVertices ? 'Включить движение карты' : 'Включить правку точек'
                  }
                  style={styles.toggle}
                />
              </>
            ) : null}

            <Button
              mode="contained"
              compact
              onPress={() =>
                mode === 'point'
                  ? mapRef.current?.requestCenter()
                  : mapRef.current?.finishPolygon()
              }
            >
              {mode === 'point' ? 'Поставить здесь' : 'Готово'}
            </Button>
          </Surface>
        </View>
      ) : (
        <>
          <IconButton
            icon="crosshairs-gps"
            mode="contained"
            size={24}
            disabled={locating}
            onPress={() => void goToUser()}
            accessibilityLabel="Показать моё местоположение"
            containerColor={theme.colors.surface}
            iconColor={theme.colors.primary}
            style={styles.recenter}
          />

          <View style={styles.addAnchor}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="plus"
                  mode="contained"
                  size={24}
                  loading={preparingDrawing}
                  disabled={preparingDrawing}
                  onPress={() => setMenuVisible(true)}
                  accessibilityLabel="Добавить поле"
                  containerColor={theme.colors.primary}
                  iconColor={theme.colors.onPrimary}
                  style={styles.add}
                />
              }
            >
              <Menu.Item
                title="Поставить точку"
                leadingIcon="map-marker-outline"
                onPress={() => {
                  setMenuVisible(false);
                  setMode('point');
                }}
              />
              <Menu.Item
                title="Обвести контур"
                leadingIcon="vector-polygon"
                onPress={() => {
                  setMenuVisible(false);
                  startPolygonMode();
                }}
              />
            </Menu>
          </View>
        </>
      )}

      <FieldFormDialog
        visible={draft !== null}
        defaults={formDefaults}
        saving={saving}
        error={saveError}
        onCancel={() => {
          setDraft(null);
          setSaveError(null);
        }}
        onSubmit={(values) => void handleSave(values)}
      />

      <Snackbar visible={snack !== null} onDismiss={() => setSnack(null)} duration={4000}>
        {snack ?? ''}
      </Snackbar>
    </View>
  );
}

function hintFor(mode: Mode, editingVertices: boolean): string {
  switch (mode) {
    case 'point':
      return 'Наведите центр карты на поле';
    case 'drawing':
      return 'Ставьте точки по контуру';
    case 'editing':
      return editingVertices
        ? 'Потяните точки, чтобы поправить контур'
        : 'Контур замкнут. Включите правку, чтобы двигать точки';
    default:
      return '';
  }
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    crosshair: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recenter: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      width: 48,
      height: 48,
      borderRadius: 24,
      margin: 0,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    addAnchor: {
      position: 'absolute',
      right: 16,
      bottom: 76,
    },
    add: {
      width: 48,
      height: 48,
      borderRadius: 24,
      margin: 0,
    },
    // Плашка и подсказка по центру и по содержимому: растянутая на всю ширину
    // панель оставляла слева пустое место, которое читалось как потерянная
    // кнопка.
    bottomBar: {
      position: 'absolute',
      right: 8,
      bottom: 16,
      left: 8,
      alignItems: 'center',
      gap: 8,
    },
    hint: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    hintText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      textAlign: 'center',
    },
    panel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 28,
      backgroundColor: theme.colors.surface,
    },
    toggle: {
      margin: 0,
    },
  });
