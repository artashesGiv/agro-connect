/**
 * HTML-страница карты 2GIS для WebView и протокол общения с ней.
 *
 * Почему WebView, а не нативная карта: официального React Native SDK у 2GIS
 * нет (в npm-организации `@2gis` только веб-пакеты), а свой нативный модуль
 * потребовал бы config-плагина и custom dev client — приложение перестало бы
 * открываться в Expo Go. MapGL JS API работает в WebView без всего этого.
 *
 * Сам MapGL подгружается тегом `<script>` с CDN 2GIS — npm-пакет `@2gis/mapgl`
 * в зависимостях не нужен (это загрузчик для сборщика, которого здесь нет).
 * Рисовалка (`terra-draw` + официальный адаптер 2GIS) подтягивается отдельно и
 * лениво — см. `loadDrawingScript`.
 */

/** Координаты в MapGL — `[долгота, широта]`, как и в WKT у `fieldsRepository`. */
export type LngLat = [number, number];

/** Куда садимся, если местоположение получить не удалось. */
export const FALLBACK_CENTER: LngLat = [37.6173, 55.7558]; // Москва
export const FALLBACK_ZOOM = 10;

/** Зум при показе местоположения пользователя. */
export const USER_ZOOM = 15;

/** Минимум вершин у контура: меньше — это не многоугольник. */
export const MIN_RING_VERTICES = 3;

/**
 * Версии пинуем намертво: плавающая версия у рисовалки — это сломанная фича
 * в один прекрасный день без единого коммита с нашей стороны.
 *
 * CDN — unpkg, а не jsDelivr, и это не вкусовщина: UMD-сборка адаптера лежит
 * в файле с расширением `.cjs`, jsDelivr отдаёт такой файл как
 * `Content-Type: application/node` вместе с `X-Content-Type-Options: nosniff`,
 * и WebView отказывается его исполнять. unpkg отдаёт `text/javascript` —
 * именно unpkg показан и в README самого адаптера.
 */
const TERRA_DRAW_URL = 'https://unpkg.com/terra-draw@1.33.0/dist/terra-draw.umd.js';
const TERRA_DRAW_ADAPTER_URL =
  'https://unpkg.com/@2gis/mapgl-terra-draw@0.4.0/dist/mapgl-terra-draw.umd.cjs';

/** Сообщения, которые страница присылает в React Native. */
export type MapMessage =
  | { type: 'ready' }
  | { type: 'error'; message: string }
  | { type: 'center'; center: LngLat }
  | { type: 'drawing-ready' }
  | { type: 'drawing-error'; message: string }
  | { type: 'polygon'; ring: LngLat[] }
  | { type: 'polygon-invalid' };

/**
 * Разбирает сообщение из WebView. Возвращает `null`, если пришло что-то
 * неожиданное: страница чужая для нас лишь наполовину, доверять ей нельзя.
 */
export function parseMapMessage(raw: string): MapMessage | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    const { type } = data as { type?: unknown };

    switch (type) {
      case 'ready':
      case 'drawing-ready':
      case 'polygon-invalid':
        return { type };
      case 'error':
      case 'drawing-error': {
        const { message } = data as { message?: unknown };
        return { type, message: typeof message === 'string' ? message : 'unknown' };
      }
      case 'center': {
        const center = readLngLat((data as { center?: unknown }).center);
        return center ? { type, center } : null;
      }
      case 'polygon': {
        const { ring } = data as { ring?: unknown };
        if (!Array.isArray(ring)) return null;
        const points = ring.flatMap((item) => {
          const point = readLngLat(item);
          return point ? [point] : [];
        });
        return points.length >= MIN_RING_VERTICES ? { type, ring: points } : { type: 'polygon-invalid' };
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function readLngLat(value: unknown): LngLat | null {
  if (!Array.isArray(value)) return null;
  const [lng, lat] = value;
  if (typeof lng !== 'number' || typeof lat !== 'number') return null;
  return [lng, lat];
}

// ─── Скрипты для injectJavaScript ────────────────────────────────────────────
// У всех в конце `true;` — иначе WebView ругается на возвращаемое значение.

/**
 * Перелёт камеры. Анимируем и центр, и зум одним движением:
 * `useHeightForAnimation` заставляет камеру идти по прямой, иначе на большой
 * разнице зумов картинка «проваливается».
 */
export function flyToScript(center: LngLat, zoom: number): string {
  return `window.__map && window.__map.flyTo(${JSON.stringify({ center, zoom })}); true;`;
}

/** Запрашивает текущий центр карты — это и есть точка под прицелом. */
export function requestCenterScript(): string {
  return 'window.__map && window.__map.sendCenter(); true;';
}

/** Отрисовывает сохранённые поля: полигоны для контуров, точки для остальных. */
export function setFieldsScript(polygons: LngLat[][], points: LngLat[]): string {
  return `window.__map && window.__map.setFields(${JSON.stringify({ polygons, points })}); true;`;
}

export function loadDrawingScript(): string {
  return 'window.__map && window.__map.loadDrawing(); true;';
}

export function startPolygonScript(): string {
  return 'window.__map && window.__map.startPolygon(); true;';
}

export function undoScript(): string {
  return 'window.__map && window.__map.undo(); true;';
}

export function finishPolygonScript(): string {
  return 'window.__map && window.__map.finishPolygon(); true;';
}

export function cancelDrawingScript(): string {
  return 'window.__map && window.__map.cancelDrawing(); true;';
}

/** Цвета страницы — из темы приложения, чтобы карта не выбивалась. */
export type MapPalette = {
  background: string;
  /** Заливка полигона поля; ожидается формат `#rrggbbaa`. */
  fieldFill: string;
  fieldStroke: string;
  pointFill: string;
  pointStroke: string;
};

/**
 * Собирает страницу с картой.
 *
 * @param key ключ MapGL JS API
 * @param palette цвета из темы приложения
 */
export function buildMapHtml(key: string, palette: MapPalette): string {
  const config = JSON.stringify({
    key,
    center: FALLBACK_CENTER,
    zoom: FALLBACK_ZOOM,
    palette,
    terraDrawUrl: TERRA_DRAW_URL,
    adapterUrl: TERRA_DRAW_ADAPTER_URL,
    minRingVertices: MIN_RING_VERTICES,
  });

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: ${palette.background}; }
    #map { width: 100%; height: 100%; }
  </style>
  <script>
    var reported = false;
    function send(payload) {
      if (payload.type === 'error') {
        if (reported) return;
        reported = true;
      }
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }
    window.onerror = function (message) {
      send({ type: 'error', message: String(message) });
    };
  </script>
  <script
    src="https://mapgl.2gis.com/api/js/v1"
    onerror="send({ type: 'error', message: 'mapgl-script-load-failed' })"
  ></script>
</head>
<body>
  <div id="map"></div>
  <script>
    (function () {
      if (typeof mapgl === 'undefined') {
        send({ type: 'error', message: 'mapgl-unavailable' });
        return;
      }

      var config = ${config};
      var map;

      try {
        map = new mapgl.Map('map', {
          key: config.key,
          center: config.center,
          zoom: config.zoom,
          // Зум-контрол в MapGL включён по умолчанию ('topRight') — оставляем.
          // Копирайт 2GIS убирать нельзя, но можно отодвинуть с кнопки рецентра.
          copyright: 'bottomLeft',
          // Без компаса вернуть север и убрать наклон было бы нечем, поэтому
          // случайный жест двумя пальцами не должен уводить карту в 3D.
          disableRotationByUserInteraction: true,
          disablePitchByUserInteraction: true
        });
      } catch (e) {
        send({ type: 'error', message: 'map-init-failed: ' + String(e) });
        return;
      }

      var FIELDS_PURPOSE = 'app-fields';
      var fieldsSource = null;
      var fieldMarkers = [];
      var drawing = null;
      var drawingLoad = null;

      map.on('styleload', function () {
        // Слой добавляем один раз; данные в него приезжают позже, через setFields.
        map.addLayer({
          id: 'app-fields-polygons',
          type: 'polygon',
          filter: ['==', ['source-attr', 'purpose'], FIELDS_PURPOSE],
          style: {
            color: config.palette.fieldFill,
            strokeColor: config.palette.fieldStroke,
            strokeWidth: 2
          }
        });
        send({ type: 'ready' });
      });
      map.on('styleloaderror', function () {
        send({ type: 'error', message: 'style-load-failed' });
      });
      // Событие с типом 'invalidtilekey' — это истёкший или чужой ключ.
      map.on('error', function (event) {
        var type = event && event.type ? String(event.type) : 'unknown';
        send({ type: 'error', message: 'map-error: ' + type });
      });

      function injectScript(src) {
        return new Promise(function (resolve, reject) {
          var el = document.createElement('script');
          el.src = src;
          el.onload = function () { resolve(); };
          el.onerror = function () { reject(new Error('script-failed: ' + src)); };
          document.head.appendChild(el);
        });
      }

      /** Убирает повторы подряд и замыкающую точку: наружу отдаём голое кольцо. */
      function cleanRing(ring) {
        var out = [];
        for (var i = 0; i < ring.length; i++) {
          var point = ring[i];
          var prev = out[out.length - 1];
          if (!prev || prev[0] !== point[0] || prev[1] !== point[1]) {
            out.push([point[0], point[1]]);
          }
        }
        if (out.length > 1) {
          var first = out[0];
          var last = out[out.length - 1];
          if (first[0] === last[0] && first[1] === last[1]) out.pop();
        }
        return out;
      }

      window.__map = {
        flyTo: function (options) {
          var animation = { animate: true, duration: 600, easing: 'easeOutCubic' };
          map.setCenter(options.center, animation);
          map.setZoom(options.zoom, {
            animate: true,
            duration: 600,
            easing: 'easeOutCubic',
            useHeightForAnimation: true
          });
        },

        sendCenter: function () {
          var center = map.getCenter();
          send({ type: 'center', center: [center[0], center[1]] });
        },

        setFields: function (data) {
          for (var i = 0; i < fieldMarkers.length; i++) {
            fieldMarkers[i].destroy();
          }
          fieldMarkers = [];

          var features = data.polygons.map(function (ring) {
            var closed = ring.slice();
            var first = closed[0];
            var last = closed[closed.length - 1];
            if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
              closed.push(first);
            }
            return {
              type: 'Feature',
              properties: {},
              geometry: { type: 'Polygon', coordinates: [closed] }
            };
          });
          var collection = { type: 'FeatureCollection', features: features };

          if (fieldsSource) {
            fieldsSource.setData(collection);
          } else {
            fieldsSource = new mapgl.GeoJsonSource(map, {
              data: collection,
              attributes: { purpose: FIELDS_PURPOSE }
            });
          }

          // Поля без контура рисуем кружком: он одинакового размера на любом
          // зуме и не требует регистрировать иконку.
          for (var j = 0; j < data.points.length; j++) {
            fieldMarkers.push(new mapgl.CircleMarker(map, {
              coordinates: data.points[j],
              radius: 8,
              color: config.palette.pointFill,
              strokeWidth: 2,
              strokeColor: config.palette.pointStroke
            }));
          }
        },

        loadDrawing: function () {
          if (drawing) {
            send({ type: 'drawing-ready' });
            return;
          }
          if (!drawingLoad) {
            // Адаптер 2GIS ищет terraDraw в глобальной области, поэтому строго
            // по очереди, а не Promise.all.
            drawingLoad = injectScript(config.terraDrawUrl)
              .then(function () { return injectScript(config.adapterUrl); })
              .then(function () {
                if (!window.terraDraw || !window.mapglTerraDraw) {
                  throw new Error('terra-draw-globals-missing');
                }
              });
          }
          drawingLoad
            .then(function () { send({ type: 'drawing-ready' }); })
            .catch(function (e) {
              drawingLoad = null;
              send({ type: 'drawing-error', message: String(e && e.message ? e.message : e) });
            });
        },

        startPolygon: function () {
          try {
            var td = window.terraDraw;
            if (!drawing) {
              var adapter = new window.mapglTerraDraw.TerraDrawMapGlAdapter({
                map: map,
                mapgl: mapgl
              });
              // Баг адаптера 0.4.0: setDoubleClickToZoom реализован копипастой
              // с setDraggability и зовёт map.blockInteraction(), то есть гасит
              // ВСЮ интерактивность карты. terra-draw вызывает его с false при
              // старте режима — и карта перестаёт двигаться, хотя обводить поле
              // без панорамирования невозможно. Глушим: двойной тап останется
              // зумом во время рисования, это несравнимо меньшая беда.
              adapter.setDoubleClickToZoom = function () {};
              drawing = new td.TerraDraw({
                adapter: adapter,
                modes: [
                  new td.TerraDrawPolygonMode({
                    // editable даёт перетаскивание вершин прямо в режиме
                    // рисования — отдельный режим выбора не нужен.
                    editable: true,
                    showCoordinatePoints: true,
                    validation: td.ValidateNotSelfIntersecting
                  })
                ]
              });
            }
            drawing.start();
            drawing.setMode('polygon');
          } catch (e) {
            send({ type: 'drawing-error', message: 'draw-start-failed: ' + String(e) });
          }
        },

        undo: function () {
          if (drawing && drawing.canUndo()) drawing.undo();
        },

        /**
         * Явного «завершить фигуру» у terra-draw нет, поэтому забираем то, что
         * уже лежит в его хранилище: строящийся полигон появляется там сразу.
         */
        finishPolygon: function () {
          if (!drawing) {
            send({ type: 'polygon-invalid' });
            return;
          }
          var polygons = drawing.getSnapshot().filter(function (feature) {
            return feature.geometry && feature.geometry.type === 'Polygon';
          });
          var latest = polygons[polygons.length - 1];
          if (!latest) {
            send({ type: 'polygon-invalid' });
            return;
          }
          var ring = cleanRing(latest.geometry.coordinates[0] || []);
          if (ring.length < config.minRingVertices) {
            send({ type: 'polygon-invalid' });
            return;
          }
          send({ type: 'polygon', ring: ring });
        },

        cancelDrawing: function () {
          if (drawing) {
            // Отдельные try: если clear() бросит, stop() всё равно должен
            // выполниться — иначе режим останется активным.
            try { drawing.clear(); } catch (e) {}
            try { drawing.stop(); } catch (e) {}
          }
          // Страховка от того же бага адаптера: интерактивность карты
          // восстанавливаем сами, а не надеемся на его бухгалтерию.
          try { map.unblockInteraction(); } catch (e) {}
        }
      };
    })();
  </script>
</body>
</html>`;
}
