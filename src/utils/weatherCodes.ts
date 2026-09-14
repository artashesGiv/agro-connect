import type { IconName } from '@/components/Icon';

/** WMO weather_code → иконка и краткое описание (стандартная таблица кодов Open-Meteo). */
const WMO_TABLE: Record<number, { icon: IconName; label: string }> = {
  0: { icon: 'weather-sunny', label: 'Ясно' },
  1: { icon: 'weather-partly-cloudy', label: 'Малооблачно' },
  2: { icon: 'weather-partly-cloudy', label: 'Переменная облачность' },
  3: { icon: 'weather-cloudy', label: 'Пасмурно' },
  45: { icon: 'weather-fog', label: 'Туман' },
  48: { icon: 'weather-fog', label: 'Изморозь' },
  51: { icon: 'weather-partly-rainy', label: 'Слабая морось' },
  53: { icon: 'weather-partly-rainy', label: 'Морось' },
  55: { icon: 'weather-rainy', label: 'Сильная морось' },
  56: { icon: 'weather-partly-rainy', label: 'Ледяная морось' },
  57: { icon: 'weather-rainy', label: 'Сильная ледяная морось' },
  61: { icon: 'weather-partly-rainy', label: 'Небольшой дождь' },
  63: { icon: 'weather-rainy', label: 'Дождь' },
  65: { icon: 'weather-pouring', label: 'Сильный дождь' },
  66: { icon: 'weather-partly-rainy', label: 'Ледяной дождь' },
  67: { icon: 'weather-pouring', label: 'Сильный ледяной дождь' },
  71: { icon: 'weather-partly-snowy', label: 'Небольшой снег' },
  73: { icon: 'weather-snowy', label: 'Снег' },
  75: { icon: 'weather-snowy-heavy', label: 'Сильный снег' },
  77: { icon: 'weather-snowy', label: 'Снежная крупа' },
  80: { icon: 'weather-partly-rainy', label: 'Небольшой ливень' },
  81: { icon: 'weather-pouring', label: 'Ливень' },
  82: { icon: 'weather-pouring', label: 'Сильный ливень' },
  85: { icon: 'weather-partly-snowy', label: 'Небольшой снегопад' },
  86: { icon: 'weather-snowy-heavy', label: 'Сильный снегопад' },
  95: { icon: 'weather-lightning', label: 'Гроза' },
  96: { icon: 'weather-lightning-rainy', label: 'Гроза с градом' },
  99: { icon: 'weather-lightning-rainy', label: 'Сильная гроза с градом' },
};

const UNKNOWN = { icon: 'weather-cloudy' as IconName, label: '—' };

export function describeWeatherCode(code: number | null): { icon: IconName; label: string } {
  if (code === null) return UNKNOWN;
  return WMO_TABLE[code] ?? UNKNOWN;
}
