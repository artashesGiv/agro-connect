import { StyleSheet } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { HelperText } from 'react-native-paper';

import { useAuth } from '../../../../services/auth';
import type { RegisterPasswordScreenProps } from '../../../../navigation/types';
import { FormTextInput } from '../../components/FormTextInput';
import { RegisterStepLayout } from '../../components/RegisterStepLayout';
import type { RegisterFormValues } from '../../schemas/registerSchema';

export default function RegisterPasswordScreen({
  navigation,
}: RegisterPasswordScreenProps) {
  const { control, handleSubmit } = useFormContext<RegisterFormValues>();
  const { status, error, signUp } = useAuth();

  const busy = status === 'authenticating';

  const submit = handleSubmit((values) =>
    signUp({
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      nickname: values.nickname,
      password: values.password,
    }),
  );

  return (
    <RegisterStepLayout
      step={4}
      title="Пароль"
      subtitle="Минимум 6 символов."
      onBack={navigation.goBack}
      onNext={submit}
      nextLabel="Зарегистрироваться"
      nextLoading={busy}
    >
      <FormTextInput
        control={control}
        name="password"
        label="Пароль"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <FormTextInput
        control={control}
        name="confirmPassword"
        label="Повторите пароль"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      {error ? (
        <HelperText type="error" visible style={styles.formError}>
          {error}
        </HelperText>
      ) : null}
    </RegisterStepLayout>
  );
}

const styles = StyleSheet.create({
  formError: {
    paddingHorizontal: 0,
  },
});
