import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface AddFieldFabProps {
  onPress: () => void;
}

export const AddFieldFab = ({ onPress }: AddFieldFabProps) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        pressed && styles.fabPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Добавить поле или точку"
    >
      <Text style={styles.fabIcon}>+</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  fabPressed: {
    backgroundColor: '#1D4ED8',
    opacity: 0.8,
  },
  fabIcon: {
    fontSize: 28,
    color: '#F8FAFC',
    fontWeight: '600',
  },
});
