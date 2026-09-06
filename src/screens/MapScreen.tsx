import React, { useRef, useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import MapView from 'react-native-maps';
import { MapScreenProps } from '../navigation/types';
import { FieldMapView } from '../map/components/FieldMapView';
import { AddFieldFab } from '../map/components/AddFieldFab';
import { WeatherLayerToggle } from '../map/components/WeatherLayerToggle';
import { MarkerDetailSheet } from '../map/components/MarkerDetailSheet';
import { useFields } from '../map/hooks/useFields';
import { useOtherUsersMarkers } from '../map/hooks/useOtherUsersMarkers';
import { useUserLocation } from '../map/hooks/useUserLocation';
import { useWeatherLayer } from '../map/hooks/useWeatherLayer';
import { Coordinate, OtherUserMarker } from '../map/types';
import { STORAGE_KEYS } from '../map/storage/asyncStorageKeys';

export default function MapScreen({ navigation }: MapScreenProps) {
  const mapRef = useRef<MapView>(null);
  const { fields, addField, updateField, deleteField } = useFields();
  const { markers: otherMarkers } = useOtherUsersMarkers();
  const { location: userLocation, permissionGranted } = useUserLocation();
  const { currentLayer, layerKind, toggleLayer } = useWeatherLayer();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedOtherMarker, setSelectedOtherMarker] = useState<OtherUserMarker | undefined>();
  const [sheetMode, setSheetMode] = useState<'create' | 'view' | 'edit'>('create');
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnCoordinates, setDrawnCoordinates] = useState<Coordinate[]>([]);
  const [userOwnerId, setUserOwnerId] = useState<string>('');

  React.useEffect(() => {
    initializeUserId();
  }, []);

  const initializeUserId = async () => {
    try {
      let id = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!id) {
        id = `user-${Date.now()}`;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, id);
      }
      setUserOwnerId(id);
    } catch (error) {
      console.error('Error initializing user ID:', error);
      setUserOwnerId(`user-${Date.now()}`);
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const openCreateSheet = () => {
    setSelectedFieldId(null);
    setSelectedOtherMarker(undefined);
    setSheetMode('create');
    setDrawingMode(false);
    setDrawnCoordinates([]);
    setSheetVisible(true);
  };

  const openViewSheet = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setSelectedOtherMarker(undefined);
    setSheetMode('view');
    setDrawingMode(false);
    setDrawnCoordinates([]);
    setSheetVisible(true);
  };

  const openEditSheet = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setSelectedOtherMarker(undefined);
    setSheetMode('edit');
    setDrawingMode(false);
    setDrawnCoordinates([]);
    setSheetVisible(true);
  };

  const openOtherMarkerSheet = (marker: OtherUserMarker) => {
    setSelectedFieldId(null);
    setSelectedOtherMarker(marker);
    setSheetMode('view');
    setSheetVisible(true);
  };

  const handleMapPress = (e: any) => {
    if (!drawingMode) return;

    const coordinate = e.nativeEvent.coordinate;
    setDrawnCoordinates((prev) => [...prev, coordinate]);
  };

  const handleStartDrawing = () => {
    setDrawingMode(true);
    setDrawnCoordinates([]);
  };

  const handleFinishDrawing = async () => {
    if (drawnCoordinates.length < 3) {
      Alert.alert('Ошибка', 'Полигон должен содержать минимум 3 точки');
      return;
    }

    const field = selectedField;
    if (!field && sheetMode === 'create') {
      try {
        await addField({
          ownerId: userOwnerId,
          name: 'Новое поле',
          geometry: {
            kind: 'polygon',
            coordinates: drawnCoordinates,
          },
        });
        setSheetVisible(false);
        setDrawingMode(false);
        setDrawnCoordinates([]);
      } catch (error) {
        Alert.alert('Ошибка', 'Не удалось создать поле');
      }
    }
  };

  const handleSaveField = async (input: any) => {
    try {
      if (sheetMode === 'create') {
        await addField(input);
      } else if (selectedField && sheetMode === 'edit') {
        await updateField(selectedField.id, input);
      }
      setSheetVisible(false);
      setDrawingMode(false);
      setDrawnCoordinates([]);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить поле');
      console.error('Error saving field:', error);
    }
  };

  const handleDeleteField = async () => {
    if (selectedField) {
      try {
        await deleteField(selectedField.id);
        setSheetVisible(false);
      } catch (error) {
        Alert.alert('Ошибка', 'Не удалось удалить поле');
        console.error('Error deleting field:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <FieldMapView
        ref={mapRef}
        initialRegion={userLocation}
        fields={fields}
        otherMarkers={otherMarkers}
        weatherLayer={currentLayer}
        onMarkerPress={openViewSheet}
        onOtherMarkerPress={openOtherMarkerSheet}
        showUserLocation={permissionGranted}
        onMapPress={handleMapPress}
      />

      <WeatherLayerToggle currentKind={layerKind} onToggle={toggleLayer} />

      <AddFieldFab onPress={openCreateSheet} />

      <MarkerDetailSheet
        visible={sheetVisible}
        onClose={() => {
          setSheetVisible(false);
          setDrawingMode(false);
          setDrawnCoordinates([]);
        }}
        mode={sheetMode}
        field={selectedField}
        otherMarker={selectedOtherMarker}
        onSave={handleSaveField}
        onDelete={handleDeleteField}
        userOwnerId={userOwnerId}
        drawingMode={drawingMode}
        drawnCoordinates={drawnCoordinates}
        onStartDrawing={handleStartDrawing}
        onFinishDrawing={handleFinishDrawing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1020',
  },
});
