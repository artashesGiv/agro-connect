import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, type MD3Theme } from 'react-native-paper';

import { useAuth } from '../../../services/auth';
import { useAppTheme } from '../../../theme';
import type { LoginScreenProps } from '../../../navigation/types';

// Заглушка: форм пока нет. Кнопка «Войти» шлёт демо-данные — сетевой слой
// обкатывается, экран логина/регистрации и переходы уже работают.
const DEMO_CREDENTIALS = { email: 'demo@demo.com', password: 'demo' };

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { status, error, signIn } = useAuth();

  const busy = status === 'authenticating';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Вход</Text>
        <Text style={styles.subtitle}>
          Форма появится позже. Пока — демо-вход для проверки навигации.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          mode="contained"
          loading={busy}
          disabled={busy}
          onPress={() => signIn(DEMO_CREDENTIALS)}
          style={styles.primaryButton}
          accessibilityLabel="Войти"
        >
          Войти
        </Button>

        <Button
          mode="text"
          disabled={busy}
          onPress={() => navigation.navigate('Register')}
          accessibilityLabel="Перейти к регистрации"
        >
          Создать аккаунт
        </Button>
      </View>
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
    },
    content: {
      paddingHorizontal: 24,
      gap: 12,
    },
    title: {
      color: theme.colors.onBackground,
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: -1,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      lineHeight: 21,
      marginBottom: 8,
    },
    error: {
      color: theme.colors.error,
      fontSize: 14,
    },
    primaryButton: {
      marginTop: 8,
    },
  });
