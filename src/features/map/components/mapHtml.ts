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
 */

/** Координаты в MapGL — `[долгота, широта]`, как и в WKT у `fieldsRepository`. */
export type LngLat = [number, number];

/** Куда садимся, если местоположение получить не удалось. */
export const FALLBACK_CENTER: LngLat = [37.6173, 55.7558]; // Москва
export const FALLBACK_ZOOM = 10;

/** Зум при показе местоположения пользователя. */
export const USER_ZOOM = 15;

/** Сообщения, которые страница присылает в React Native. */
export type MapMessage =
  | { type: 'ready' }
  | { type: 'error'; message: string };

/**
 * Разбирает сообщение из WebView. Возвращает `null`, если пришло что-то
 * неожиданное: страница чужая для нас лишь наполовину, доверять ей нельзя.
 */
export function parseMapMessage(raw: string): MapMessage | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    const { type } = data as { type?: unknown };
    if (type === 'ready') return { type: 'ready' };
    if (type === 'error') {
      const { message } = data as { message?: unknown };
      return {
        type: 'error',
        message: typeof message === 'string' ? message : 'unknown',
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * JS для `injectJavaScript`: перелёт камеры. Анимируем и центр, и зум одним
 * движением — `useHeightForAnimation` заставляет камеру идти по прямой,
 * иначе на большой разнице зумов картинка «проваливается».
 */
export function flyToScript(center: LngLat, zoom: number): string {
  const args = JSON.stringify({ center, zoom });
  // `true;` в конце — иначе WebView ругается на возвращаемое значение.
  return `window.__flyTo && window.__flyTo(${args}); true;`;
}

/**
 * Собирает страницу с картой.
 *
 * @param key ключ MapGL JS API
 * @param backgroundColor фон под картой, чтобы при загрузке не мигало белым
 */
export function buildMapHtml(key: string, backgroundColor: string): string {
  const initial = JSON.stringify({
    key,
    center: FALLBACK_CENTER,
    zoom: FALLBACK_ZOOM,
  });

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: ${backgroundColor}; }
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

      var initial = ${initial};
      var map;

      try {
        map = new mapgl.Map('map', {
          key: initial.key,
          center: initial.center,
          zoom: initial.zoom,
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

      map.on('styleload', function () {
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

      window.__flyTo = function (options) {
        var animation = { animate: true, duration: 600, easing: 'easeOutCubic' };
        map.setCenter(options.center, animation);
        map.setZoom(
          options.zoom,
          { animate: true, duration: 600, easing: 'easeOutCubic', useHeightForAnimation: true }
        );
      };
    })();
  </script>
</body>
</html>`;
}
