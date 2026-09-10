import { useMemo } from 'react';
import { Keyboard, StyleSheet, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, HelperText, type MD3Theme } from 'react-native-paper';

import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import type { LoginScreenProps } from '@/navigation/types';
import { useAuth } from '@/services/auth';
import { useAppTheme } from '@/theme';

import { FormTextInput } from '@/components/FormTextInput';
import {
  loginDefaults,
  loginSchema,
  type LoginFormValues,
} from '../schemas/loginSchema';

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { status, error, signIn } = useAuth();
  const busy = status === 'authenticating';

  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaults,
    mode: 'onTouched',
  });

  const onSubmit = (values: LoginFormValues) => {
    Keyboard.dismiss();
    return signIn(values);
  };

  return (
    <KeyboardAwareScreen contentContainerStyle={styles.content}>
      <Text style={styles.title}>Вход</Text>
      <Text style={styles.subtitle}>Войдите, чтобы продолжить.</Text>

      {error ? (
        <HelperText type="error" visible style={styles.formError}>
          {error}
        </HelperText>
      ) : null}

      <FormTextInput
        control={control}
        name="email"
        label="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        autoCorrect={false}
      />

      <FormTextInput
        control={control}
        name="password"
        label="Пароль"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
      />

      <Button
        mode="contained"
        loading={busy}
        disabled={busy}
        onPress={handleSubmit(onSubmit)}
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
    </KeyboardAwareScreen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
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
      marginBottom: 16,
    },
    formError: {
      paddingHorizontal: 0,
    },
    primaryButton: {
      marginTop: 8,
    },
  });
