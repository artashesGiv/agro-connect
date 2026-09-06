import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.badge}>
        <Text style={styles.badgeText}>EXPO · TYPESCRIPT · ANDROID</Text>
      </View>

      <Text style={styles.title}>Базовое приложение готово</Text>
      <Text style={styles.description}>
        Проект настроен для быстрой разработки с Codex и сборки APK через
        EAS Build.
      </Text>

      <View style={styles.card}>
        <Text style={styles.counterLabel}>Проверка интерактивности</Text>
        <Text style={styles.counter}>{count}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Увеличить счётчик"
          onPress={() => setCount((value) => value + 1)}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Нажать</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1020',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#172554',
    borderColor: '#2563EB',
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 40,
  },
  description: {
    color: '#94A3B8',
    fontSize: 17,
    lineHeight: 25,
    marginTop: 12,
  },
  card: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 36,
    padding: 24,
  },
  counterLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  counter: {
    color: '#FFFFFF',
    fontSize: 56,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    marginBottom: 20,
    marginTop: 8,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 14,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
