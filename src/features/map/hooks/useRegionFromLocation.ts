import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

import { isKnownRegion, type RfRegion } from '@/constants/regions';

/** Сколько ждём фикс, прежде чем считать геолокацию недоступной. */
const FIX_TIMEOUT_MS = 8000;

export type RegionLocateResult =
  | { status: 'ok'; region: RfRegion }
  | { status: 'denied' }
  | { status: 'unavailable' };

/**
 * Определение региона по текущей геолокации — для поля «Регион» в форме поля.
 * Профиль уже даёт регион по умолчанию (см. `fieldDefaults`), это лишь способ
 * сменить его на фактический без похода в список из полусотни пунктов.
 *
 * `reverseGeocodeAsync` отдаёт `region`/`subregion` в локали устройства, что
 * не гарантированно совпадает с написанием из `RF_REGIONS` (другой регион ОС,
 * иное административное деление у провайдера и т.п.) — в этом случае честно
 * возвращаем `unavailable`, ничего не подставляя, чтобы не записать в форму
 * значение, которого нет в списке.
 */
export function useRegionFromLocation() {
  const [locating, setLocating] = useState(false);

  const locate = useCallback(async (): Promise<RegionLocateResult> => {
    setLocating(true);
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) return { status: 'denied' };

      const position = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        FIX_TIMEOUT_MS,
      );
      if (!position) return { status: 'unavailable' };

      const [address] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const candidate = address?.region ?? address?.subregion ?? null;
      return isKnownRegion(candidate) ? { status: 'ok', region: candidate } : { status: 'unavailable' };
    } catch {
      return { status: 'unavailable' };
    } finally {
      setLocating(false);
    }
  }, []);

  return { locate, locating };
}

/** Возвращает `null`, если промис не успел за `ms`. */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
