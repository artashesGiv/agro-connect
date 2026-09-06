import { WeatherLayerKind } from '../types';

export function getWeatherTileUrl(kind: WeatherLayerKind): string {
  const apiKey = process.env.EXPO_PUBLIC_WEATHER_TILES_API_KEY || '';

  const baseUrl = 'https://tile.openweathermap.org/map';

  const layerMap: Record<WeatherLayerKind, string | null> = {
    none: null,
    precipitation: 'precipitation_new',
    clouds: 'clouds_new',
    temperature: 'temp_new',
  };

  const layer = layerMap[kind];
  if (!layer) {
    return '';
  }

  return `${baseUrl}/${layer}/{z}/{x}/{y}.png?appid=${apiKey}`;
}
