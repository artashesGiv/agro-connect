import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MD3Theme } from 'react-native-paper';

import { Screen } from '@/components/Screen';
import { useAppTheme } from '@/theme';

export default function HomeScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [count, setCount] = useState(0);

  return (
    <Screen style={styles.container}>
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
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
      borderRadius: 999,
      borderWidth: 1,
      marginBottom: 20,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    badgeText: {
      color: theme.colors.onPrimaryContainer,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    title: {
      color: theme.colors.onBackground,
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: -1,
      lineHeight: 40,
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 17,
      lineHeight: 25,
      marginTop: 12,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderRadius: 24,
      borderWidth: 1,
      marginTop: 36,
      padding: 24,
    },
    counterLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      fontWeight: '600',
    },
    counter: {
      color: theme.colors.onSurface,
      fontSize: 56,
      fontVariant: ['tabular-nums'],
      fontWeight: '800',
      marginBottom: 20,
      marginTop: 8,
    },
    button: {
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
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
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
  });
