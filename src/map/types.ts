export interface Coordinate {
  latitude: number;
  longitude: number;
}

export type FieldGeometry =
  | { kind: 'point'; coordinate: Coordinate }
  | { kind: 'polygon'; coordinates: Coordinate[] };

export interface Field {
  id: string;
  ownerId: string;
  name: string;
  notes?: string;
  geometry: FieldGeometry;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OtherUserMarker {
  id: string;
  ownerId: string;
  ownerLabel: string;
  coordinate: Coordinate;
  title: string;
}

export type WeatherLayerKind = 'none' | 'precipitation' | 'clouds' | 'temperature';

export interface WeatherLayerConfig {
  kind: WeatherLayerKind;
  urlTemplate?: string;
  opacity: number;
}
