import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, type MD3Theme } from 'react-native-paper';

import { useAuth } from '../../../services/auth';
import { useAppTheme } from '../../../theme';
import type { RegisterScreenProps } from '../../../navigation/types';

// Заглушка: форм пока нет. Кнопка шлёт демо-данные на тестовый сервер.
const DEMO_PAYLOAD = { email: 'demo@demo.com', password: 'demo', name: 'Demo' };

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { status, error, signUp } = useAuth();

  const busy = status === 'authenticating';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Регистрация</Text>
        <Text style={styles.subtitle}>
          Форма появится позже. Пока — демо-регистрация для проверки навигации.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          mode="contained"
          loading={busy}
          disabled={busy}
          onPress={() => signUp(DEMO_PAYLOAD)}
          style={styles.primaryButton}
          accessibilityLabel="Зарегистрироваться"
        >
          Зарегистрироваться
        </Button>

        <Button
          mode="text"
          disabled={busy}
          onPress={() => navigation.navigate('Login')}
          accessibilityLabel="Вернуться ко входу"
        >
          У меня уже есть аккаунт
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
