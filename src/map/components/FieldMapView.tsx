import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polygon, UrlTile } from 'react-native-maps';
import { Field, Coordinate, OtherUserMarker, WeatherLayerConfig } from '../types';

interface FieldMapViewProps {
  initialRegion: Coordinate;
  fields: Field[];
  otherMarkers: OtherUserMarker[];
  weatherLayer: WeatherLayerConfig | null;
  onMarkerPress: (fieldId: string) => void;
  onOtherMarkerPress: (marker: OtherUserMarker) => void;
  showUserLocation: boolean;
  onMapPress?: (e: any) => void;
}

export const FieldMapView = React.forwardRef<MapView, FieldMapViewProps>(
  (
    {
      initialRegion,
      fields,
      otherMarkers,
      weatherLayer,
      onMarkerPress,
      onOtherMarkerPress,
      showUserLocation,
      onMapPress,
    },
    ref
  ) => {
    return (
      <MapView
        ref={ref}
        style={styles.map}
        initialRegion={{
          latitude: initialRegion.latitude,
          longitude: initialRegion.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={showUserLocation}
        onPress={onMapPress}
      >
        {weatherLayer && weatherLayer.urlTemplate && (
          <UrlTile
            urlTemplate={weatherLayer.urlTemplate}
            maximumZ={19}
            opacity={weatherLayer.opacity}
          />
        )}

        {fields.map((field) => {
          if (field.geometry.kind === 'point') {
            return (
              <Marker
                key={field.id}
                coordinate={field.geometry.coordinate}
                title={field.name}
                description={field.notes}
                onPress={() => onMarkerPress(field.id)}
                pinColor={field.color || '#93C5FD'}
              />
            );
          } else {
            return (
              <Polygon
                key={field.id}
                coordinates={field.geometry.coordinates}
                fillColor={(field.color || '#2563EB') + '33'}
                strokeColor={field.color || '#2563EB'}
                strokeWidth={2}
                onPress={() => onMarkerPress(field.id)}
              />
            );
          }
        })}

        {otherMarkers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.ownerLabel}
            onPress={() => onOtherMarkerPress(marker)}
            pinColor="#64748B"
            opacity={0.7}
          />
        ))}
      </MapView>
    );
  }
);

FieldMapView.displayName = 'FieldMapView';

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
