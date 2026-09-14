import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Keyboard, StyleSheet, View } from 'react-native';
import { Button, HelperText, Snackbar, type MD3Theme } from 'react-native-paper';

import { AppHeader } from '@/components/AppHeader';
import { FormTextInput } from '@/components/FormTextInput';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import type { ChangePasswordScreenProps } from '@/navigation/types';
import { useAuth } from '@/services/auth';
import { toUserMessage } from '@/services/supabase';
import { useAppTheme } from '@/theme';

import {
  changePasswordDefaults,
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '../schemas/changePasswordSchema';

export default function ChangePasswordScreen({ navigation }: ChangePasswordScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { changePassword } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const { control, handleSubmit } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: changePasswordDefaults,
    mode: 'onTouched',
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    Keyboard.dismiss();
    setFormError(null);
    setSubmitting(true);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      setDone(true);
    } catch (cause) {
      setFormError(toUserMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Сменить пароль" onBack={navigation.goBack} />
      <KeyboardAwareScreen edges={['bottom']} contentContainerStyle={styles.content}>
        <View style={styles.body}>
          {formError ? (
            <HelperText type="error" visible style={styles.formError}>
              {formError}
            </HelperText>
          ) : null}

          <FormTextInput
            control={control}
            name="currentPassword"
            label="Текущий пароль"
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
          />
          <FormTextInput
            control={control}
            name="newPassword"
            label="Новый пароль"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <FormTextInput
            control={control}
            name="confirmPassword"
            label="Повторите новый пароль"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
          />

          <Button
            mode="contained"
            loading={submitting}
            disabled={submitting}
            onPress={handleSubmit(onSubmit)}
            style={styles.saveButton}
            accessibilityLabel="Сохранить новый пароль"
          >
            Сохранить
          </Button>
        </View>
      </KeyboardAwareScreen>

      <Snackbar visible={done} onDismiss={() => navigation.goBack()} duration={2000}>
        Пароль изменён
      </Snackbar>
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flexGrow: 1,
      paddingBottom: 24,
    },
    body: {
      paddingHorizontal: 24,
      paddingTop: 20,
    },
    formError: {
      paddingHorizontal: 0,
    },
    saveButton: {
      marginTop: 8,
    },
  });
