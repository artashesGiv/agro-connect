import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Coordinate } from '../types';

const DEFAULT_REGION: Coordinate = {
  latitude: 55.7558,
  longitude: 37.6173,
};

export function useUserLocation() {
  const [location, setLocation] = useState<Coordinate | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionGranted(true);
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      } else {
        setPermissionGranted(false);
        setLocation(DEFAULT_REGION);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocation(DEFAULT_REGION);
    } finally {
      setLoading(false);
    }
  };

  return {
    location: location || DEFAULT_REGION,
    permissionGranted,
    loading,
  };
}
