import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WeatherLayerKind } from '../types';

interface WeatherLayerToggleProps {
  currentKind: WeatherLayerKind;
  onToggle: (kind: WeatherLayerKind) => void;
}

export const WeatherLayerToggle = ({
  currentKind,
  onToggle,
}: WeatherLayerToggleProps) => {
  const options: WeatherLayerKind[] = ['precipitation', 'clouds', 'temperature'];

  const getLabel = (kind: WeatherLayerKind): string => {
    const labels: Record<WeatherLayerKind, string> = {
      precipitation: '🌧️ Осадки',
      clouds: '☁️ Облака',
      temperature: '🌡️ Температура',
      none: 'Погода: нет',
    };
    return labels[kind];
  };

  return (
    <View style={styles.container}>
      {options.map((kind) => (
        <Pressable
          key={kind}
          style={({ pressed }) => [
            styles.button,
            currentKind === kind && styles.buttonActive,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => onToggle(kind)}
          accessibilityRole="button"
          accessibilityLabel={`Слой погоды: ${getLabel(kind)}`}
          accessibilityState={{ selected: currentKind === kind }}
        >
          <Text
            style={[
              styles.label,
              currentKind === kind && styles.labelActive,
            ]}
          >
            {getLabel(kind)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 36,
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  label: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  labelActive: {
    color: '#F8FAFC',
  },
});
