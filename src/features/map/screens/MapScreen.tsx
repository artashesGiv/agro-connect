import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { Button, IconButton, type MD3Theme, Menu, Snackbar, Surface } from 'react-native-paper';

import { AppHeader } from '@/components/AppHeader';
import { Icon } from '@/components/Icon';
import { isKnownRegion } from '@/constants/regions';
import { useAuth } from '@/services/auth';
import { toUserMessage } from '@/services/supabase';
import { useAppTheme } from '@/theme';

import { FieldCardDialog } from '../components/FieldCardDialog';
import { FieldFormDialog } from '../components/FieldFormDialog';
import { MapGLView, type MapGLViewHandle } from '../components/MapGLView';
import {
  USER_ZOOM,
  type FieldShape,
  type LngLat,
  type MapMessage,
} from '../components/mapHtml';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { useFields } from '@/hooks/useFields';
import type { MapScreenProps } from '@/navigation/types';
import { centroid, createField, updateField, type Coordinates } from '@/services/fields';
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
type Geometry = { center: Coordinates } | { boundary: Coordinates[] };

/**
 * Что именно сохранит форма. Три случая различаются и запросом к базе, и
 * заголовком диалога, поэтому они здесь, а не выводятся из пары флагов.
 */
type Pending =
  | { kind: 'create'; geometry: Geometry }
  | { kind: 'geometry'; id: string; geometry: Geometry }
  | { kind: 'info'; id: string };

/**
 * Вкладка «Карта»: карта 2GIS, свои поля на ней и создание новых.
 *
 * При появлении вкладки камера едет на местоположение пользователя, а список
 * полей перезагружается. Если местоположения нет, карта остаётся там, где
 * открылась (Москва, обзорный зум) — уводить туда камеру повторно не нужно,
 * это только сбрасывало бы то, что человек рассматривал.
 *
 * Сверху — общий `AppHeader` (нативный хедер вкладки выключен); он же даёт
 * верхнюю safe-area врезку, поэтому обёртка `Screen` здесь не нужна.
 */
export default function MapScreen({ navigation, route }: MapScreenProps) {
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
  const [pending, setPending] = useState<Pending | null>(null);
  /** Поле, по которому тапнули: показываем карточку. */
  const [cardFieldId, setCardFieldId] = useState<string | null>(null);
  /** Поле, чью геометрию сейчас правим. `null` — создаём новое. */
  const [geometryTargetId, setGeometryTargetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  /**
   * Контур, который нужно загрузить в редактор вместо рисования с нуля.
   * Живёт в ref, потому что нужен в обработчике `drawing-ready`, а тот не
   * должен пересоздаваться на каждую правку.
   */
  const editRingRef = useRef<LngLat[] | null>(null);

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
      // Вкладка монтируется скрытой (`lazy: false`), поэтому при появлении
      // просим карту перемерить контейнер: иначе она может остаться с
      // размером, который был у WebView до показа.
      mapRef.current?.invalidateSize();
      // Камеру не трогаем, если создаём поле (незаконченный контур уехал бы
      // за экран) или если нас позвали к конкретному полю с другой вкладки.
      if (modeRef.current === 'idle' && !focusPendingRef.current) void goToUser();
    }, [goToUser, reload]),
  );

  // Полигоны и одиночные точки страница рисует по-разному, поэтому делим
  // здесь; id едет вместе с фигурой, чтобы тап вернулся строкой из базы.
  useEffect(() => {
    const shapes: FieldShape[] = [];
    for (const field of fields) {
      if (field.boundary) {
        shapes.push({
          id: field.id,
          ring: field.boundary.map((point): LngLat => [point.longitude, point.latitude]),
        });
      } else if (field.center) {
        shapes.push({
          id: field.id,
          center: [field.center.longitude, field.center.latitude],
        });
      }
    }
    mapRef.current?.setFields(shapes);
  }, [fields]);

  /**
   * Со вкладки профиля приходит id поля: подлетаем к нему и, если просили,
   * открываем карточку. Ждём, пока поле окажется в списке — навигация вполне
   * может опередить загрузку. Параметры сбрасываем, иначе каждый возврат на
   * вкладку повторял бы перелёт.
   */
  const focusFieldId = route.params?.focusFieldId;
  const focusOpensCard = route.params?.openCard === true;
  const focusPendingRef = useRef(false);
  focusPendingRef.current = focusFieldId !== undefined;

  useEffect(() => {
    if (!focusFieldId) return;
    const target = fields.find((item) => item.id === focusFieldId);
    if (!target) return;

    const point = target.center ?? (target.boundary ? centroid(target.boundary) : null);
    if (point) mapRef.current?.flyTo([point.longitude, point.latitude], USER_ZOOM);
    if (focusOpensCard) setCardFieldId(target.id);
    navigation.setParams({ focusFieldId: undefined, openCard: undefined });
  }, [fields, focusFieldId, focusOpensCard, navigation]);

  const stopDrawing = useCallback(() => {
    mapRef.current?.cancelDrawing();
    mapRef.current?.setFieldTaps(true);
    editRingRef.current = null;
    setMode('idle');
    setEditingVertices(false);
    setPending(null);
    setGeometryTargetId(null);
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

  /** Общий вход в любой режим создания или правки геометрии. */
  const beginGeometry = useCallback((fieldId: string | null) => {
    setGeometryTargetId(fieldId);
    // Пока рисуем, тап по соседнему полю открывал бы карточку поверх работы.
    mapRef.current?.setFieldTaps(false);
  }, []);

  const startPolygonMode = useCallback(
    (fieldId: string | null, ring: LngLat[] | null) => {
      beginGeometry(fieldId);
      editRingRef.current = ring;
      setPreparingDrawing(true);
      mapRef.current?.loadDrawing();
    },
    [beginGeometry],
  );

  const startPointMode = useCallback(
    (fieldId: string | null, center: Coordinates | null) => {
      beginGeometry(fieldId);
      if (center) mapRef.current?.flyTo([center.longitude, center.latitude], USER_ZOOM);
      setMode('point');
    },
    [beginGeometry],
  );

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

  // Читаем цель правки из колбэка, не пересоздавая его на каждое изменение.
  const geometryTargetIdRef = useRef<string | null>(null);
  geometryTargetIdRef.current = geometryTargetId;

  const handleMapEvent = useCallback((message: MapMessage) => {
    switch (message.type) {
      case 'center':
        setPending(
          pendingFor(geometryTargetIdRef.current, {
            center: { longitude: message.center[0], latitude: message.center[1] },
          }),
        );
        break;
      case 'field-tap':
        setCardFieldId(message.id);
        break;
      case 'contour-closed':
        setMode('editing');
        // Входим в правку с жестами у карты: так фаза не начинается с
        // сюрприза «карта не двигается».
        setEditingVertices(false);
        mapRef.current?.setEditInteraction(false);
        break;
      case 'polygon':
        setPending(
          pendingFor(geometryTargetIdRef.current, {
            boundary: message.ring.map(([longitude, latitude]) => ({ longitude, latitude })),
          }),
        );
        break;
      case 'polygon-invalid':
        setSnack('Поставьте хотя бы три точки');
        break;
      case 'drawing-ready': {
        setPreparingDrawing(false);
        const ring = editRingRef.current;
        if (ring) {
          // Правка существующего поля начинается сразу с готового контура.
          mapRef.current?.editPolygon(ring);
        } else {
          setMode('drawing');
          mapRef.current?.startPolygon();
        }
        break;
      }
      case 'drawing-error':
        setPreparingDrawing(false);
        // Пользователю причина ни о чём не скажет, а в Metro она нужна: сюда
        // приходит и «скрипт не загрузился», и «CDN отдал не тот MIME».
        if (__DEV__) console.warn('[Карта] рисовалка: ' + message.message);
        // Не загрузиться и не открыться — разные беды: во втором случае
        // инструмент на месте, и «проверьте интернет» только запутает.
        setSnack(
          message.message.startsWith('draw-')
            ? 'Не удалось открыть редактор контура'
            : 'Не удалось загрузить инструмент рисования',
        );
        break;
      default:
        break;
    }
  }, []);

  /**
   * Страницу пересоздали: рисовалка и начатый контур исчезли вместе с ней.
   * Выходим из режима создания, иначе на панели остались бы кнопки, которым
   * уже нечем управлять.
   */
  const handleMapReload = useCallback(() => {
    if (modeRef.current !== 'idle') {
      setSnack('Карта перезагрузилась, создание отменено');
    }
    setMode('idle');
    setEditingVertices(false);
    setPending(null);
    setGeometryTargetId(null);
    editRingRef.current = null;
    // Тапы по полям на время создания глушились, и это состояние переживает
    // перезагрузку страницы — возвращаем его руками.
    mapRef.current?.setFieldTaps(true);
  }, []);

  const handleSave = useCallback(
    async (values: FieldFormValues) => {
      if (!pending) return;
      if (!user) {
        // Вкладка живёт за гейтом авторизации, так что сюда не попасть; но
        // молча ничего не делать по нажатию «Сохранить» — худший из исходов.
        setSaveError('Сессия не найдена. Войдите заново.');
        return;
      }
      const region = values.region.length > 0 ? values.region : null;
      setSaving(true);
      setSaveError(null);
      try {
        if (pending.kind === 'info') {
          // Геометрию не трогаем вовсе: правка названия не должна затирать
          // контур, который мы даже не показывали в этой форме.
          await updateField(pending.id, { name: values.name, region });
          setPending(null);
          setSnack('Поле обновлено');
        } else {
          const geometry = pending.geometry;
          const patch = {
            name: values.name,
            region,
            center: 'center' in geometry ? geometry.center : null,
            boundary: 'boundary' in geometry ? geometry.boundary : null,
          };
          if (pending.kind === 'geometry') {
            await updateField(pending.id, patch);
          } else {
            await createField(user.id, patch);
          }
          stopDrawing();
          setSnack(pending.kind === 'geometry' ? 'Поле обновлено' : 'Поле сохранено');
        }
        await reload();
      } catch (cause) {
        // Нарисованное намеренно не сбрасываем: обводить поле заново из-за
        // пропавшей сети — худшее, что можно предложить.
        setSaveError(toUserMessage(cause));
      } finally {
        setSaving(false);
      }
    },
    [pending, reload, stopDrawing, user],
  );

  // Раньше `error` из `useFields` не использовался нигде: неудачная загрузка
  // выглядела как «полей нет», и отличить одно от другого было невозможно.
  useEffect(() => {
    if (fieldsError) setSnack(fieldsError);
  }, [fieldsError]);

  const cardField = useMemo(
    () => fields.find((item) => item.id === cardFieldId) ?? null,
    [cardFieldId, fields],
  );

  // Мемоизируем: `FieldFormDialog` сбрасывает форму при смене `defaults`, и
  // новый объект на каждый рендер затирал бы то, что пользователь печатает.
  const formDefaults = useMemo(() => {
    if (pending && pending.kind !== 'create') {
      const target = fields.find((item) => item.id === pending.id);
      if (target) {
        return {
          name: target.name,
          region: isKnownRegion(target.region) ? target.region : '',
        };
      }
    }
    return fieldDefaults(fields.length, profile?.region ?? null);
  }, [fields, pending, profile?.region]);

  const editingExisting = pending !== null && pending.kind !== 'create';

  /** Карточка → правка координат: точке нужен прицел, контуру — редактор. */
  const editGeometry = useCallback(() => {
    if (!cardField) return;
    setCardFieldId(null);
    if (cardField.boundary) {
      startPolygonMode(
        cardField.id,
        cardField.boundary.map((point): LngLat => [point.longitude, point.latitude]),
      );
    } else {
      startPointMode(cardField.id, cardField.center);
    }
  }, [cardField, startPointMode, startPolygonMode]);

  const editInfo = useCallback(() => {
    if (!cardField) return;
    setCardFieldId(null);
    setPending({ kind: 'info', id: cardField.id });
  }, [cardField]);

  const creating = mode !== 'idle';

  return (
    <View style={styles.root}>
      <AppHeader title="Карта" />
      <View style={styles.container}>
        <MapGLView ref={mapRef} onEvent={handleMapEvent} onReload={handleMapReload} />

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
                  startPointMode(null, null);
                }}
              />
              <Menu.Item
                title="Обвести контур"
                leadingIcon="vector-polygon"
                onPress={() => {
                  setMenuVisible(false);
                  startPolygonMode(null, null);
                }}
              />
            </Menu>
          </View>
        </>
      )}

      <FieldCardDialog
        field={cardField}
        onClose={() => setCardFieldId(null)}
        onEditInfo={editInfo}
        onEditGeometry={editGeometry}
      />

      <FieldFormDialog
        visible={pending !== null}
        title={editingExisting ? 'Правка поля' : 'Новое поле'}
        submitLabel={editingExisting ? 'Обновить' : 'Сохранить'}
        defaults={formDefaults}
        saving={saving}
        error={saveError}
        onCancel={() => {
          setPending(null);
          setSaveError(null);
        }}
        onSubmit={(values) => void handleSave(values)}
      />

        <Snackbar visible={snack !== null} onDismiss={() => setSnack(null)} duration={4000}>
          {snack ?? ''}
        </Snackbar>
      </View>
    </View>
  );
}

/** Одна и та же геометрия сохраняется по-разному, смотря что мы правим. */
function pendingFor(targetId: string | null, geometry: Geometry): Pending {
  return targetId === null
    ? { kind: 'create', geometry }
    : { kind: 'geometry', id: targetId, geometry };
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
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
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
