import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

/**
 * `isInternetReachable` бывает `null` до первого реального измерения — трактуем
 * как «онлайн», чтобы баннер не мигал офлайном на старте раньше времени.
 * Офлайном считаем только явное `false` хотя бы по одному из полей.
 */
function computeIsOnline(state: NetInfoState): boolean {
  return state.isConnected !== false && state.isInternetReachable !== false;
}

/**
 * Последнее известное состояние сети — общее для всех хуков в процессе, а не
 * заново `true` при каждом монтировании. Без этого новый экран (например,
 * шаг «Поле» в мастере создания поста) на первом рендере всегда стартовал бы
 * с оптимистичного «онлайн», даже если телефон в авиарежиме уже давно —
 * `useEffect` ниже узнал бы об этом лишь на следующем тике, а `reload()`,
 * вызванный раньше (например, из `useFocusEffect`), успевал бы уйти в
 * реальный запрос и зависнуть на нём вместо мгновенного фолбэка в кэш.
 * Подписка на модульном уровне живёт всё время работы приложения и держит
 * это значение свежим независимо от того, смонтирован ли сейчас хоть один
 * компонент с `useNetworkStatus`.
 */
let lastKnownIsOnline = true;
NetInfo.addEventListener((state) => {
  lastKnownIsOnline = computeIsOnline(state);
});

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(lastKnownIsOnline);

  useEffect(() => {
    // Могло измениться между рендером (значение выше) и этим эффектом.
    setIsOnline(lastKnownIsOnline);
    return NetInfo.addEventListener((state) => {
      const next = computeIsOnline(state);
      lastKnownIsOnline = next;
      setIsOnline(next);
    });
  }, []);

  return isOnline;
}
