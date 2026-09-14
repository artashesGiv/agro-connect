import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase';

export type ForecastHours = 24 | 48 | 72 | 168;

export type WeatherVariable =
  | 'temperature_2m'
  | 'relative_humidity_2m'
  | 'precipitation_probability'
  | 'precipitation'
  | 'weather_code'
  | 'cloud_cover'
  | 'wind_speed_10m'
  | 'wind_direction_10m'
  | 'wind_gusts_10m'
  | 'soil_temperature_6cm';

export type WeatherHour = { time: string } & Record<WeatherVariable, number | null>;

export type FieldWeatherResponse = {
  field_id: string;
  hours: ForecastHours;
  timezone: string;
  location: { latitude: number; longitude: number; source: 'center' | 'boundary_point_on_surface' };
  model_location: { latitude: number; longitude: number; elevation_m: number | null };
  forecast_start: string;
  forecast_end: string;
  units: Record<WeatherVariable, string>;
  summary: {
    temperature_min_c: number | null;
    temperature_max_c: number | null;
    precipitation_total_mm: number | null;
    precipitation_probability_max_pct: number | null;
    wind_speed_max_ms: number | null;
    temperature_valid_hours: number;
    precipitation_valid_hours: number;
  };
  hourly: WeatherHour[];
  meta: {
    provider: 'open-meteo';
    attribution: string;
    attribution_url: string;
    source: 'provider' | 'cache' | 'stale_cache';
    stale: boolean;
    fetched_at: string;
    expires_at: string;
    age_seconds: number;
    request_id: string;
    warnings: string[];
  };
};

const FALLBACK = 'Не удалось получить погоду. Попробуйте позже.';

/** Коды `field-weather` (см. бэкенд API.md), которые пользователь реально может увидеть. */
const ERROR_MESSAGES: Record<string, string> = {
  FIELD_NOT_FOUND: 'Поле не найдено или недоступно.',
  FIELD_LOCATION_UNAVAILABLE: 'У поля нет координат — укажите точку или контур на карте.',
  UNAUTHORIZED: 'Войдите заново, чтобы посмотреть погоду.',
  WEATHER_REFRESH_IN_PROGRESS: 'Погода обновляется, попробуйте через пару секунд.',
  PROVIDER_TIMEOUT: 'Сервис погоды не отвечает. Попробуйте позже.',
  PROVIDER_UNAVAILABLE: 'Сервис погоды временно недоступен.',
  PROVIDER_RATE_LIMITED: 'Сервис погоды перегружен. Попробуйте позже.',
};

export async function getFieldWeather(
  fieldId: string,
  hours: ForecastHours = 24,
): Promise<FieldWeatherResponse> {
  const { data, error } = await supabase.functions.invoke<FieldWeatherResponse>('field-weather', {
    body: { field_id: fieldId, hours },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = (await error.context.json().catch(() => null)) as { code?: string } | null;
      throw new Error((body?.code && ERROR_MESSAGES[body.code]) || FALLBACK);
    }
    throw new Error(FALLBACK);
  }
  if (!data) throw new Error(FALLBACK);
  return data;
}
