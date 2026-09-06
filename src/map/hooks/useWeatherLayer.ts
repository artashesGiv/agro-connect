import { useState } from 'react';
import { WeatherLayerKind, WeatherLayerConfig } from '../types';
import { getWeatherTileUrl } from '../weather/weatherTileConfig';

export function useWeatherLayer() {
  const [layerKind, setLayerKind] = useState<WeatherLayerKind>('none');

  const currentLayer: WeatherLayerConfig | null =
    layerKind === 'none'
      ? null
      : {
          kind: layerKind,
          urlTemplate: getWeatherTileUrl(layerKind),
          opacity: 0.5,
        };

  const toggleLayer = (kind: WeatherLayerKind) => {
    setLayerKind((prev) => (prev === kind ? 'none' : kind));
  };

  return {
    currentLayer,
    layerKind,
    toggleLayer,
  };
}
