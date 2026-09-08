import { StyleSheet } from 'react-native';
import { useFormContext, useWatch } from 'react-hook-form';
import { Button } from 'react-native-paper';

import { authApi } from '../../../../services/auth';
import type { RegisterCodeScreenProps } from '../../../../navigation/types';
import { FormTextInput } from '../../components/FormTextInput';
import { RegisterStepLayout } from '../../components/RegisterStepLayout';
import {
  REGISTER_STEP_FIELDS,
  type RegisterFormValues,
} from '../../schemas/registerSchema';

export default function RegisterCodeScreen({ navigation }: RegisterCodeScreenProps) {
  const { control, trigger, getValues } = useFormContext<RegisterFormValues>();
  const email = useWatch({ control, name: 'email' });

  const handleNext = async () => {
    if (!(await trigger(REGISTER_STEP_FIELDS.code))) return;
    void authApi.verifyCode(getValues('email'), getValues('code'));
    navigation.navigate('RegisterProfile');
  };

  return (
    <RegisterStepLayout
      step={2}
      title="Код подтверждения"
      subtitle={`Мы отправили код на ${email || 'вашу почту'}. Для демо подойдёт любой.`}
      onBack={navigation.goBack}
      onNext={handleNext}
    >
      <FormTextInput
        control={control}
        name="code"
        label="Код из письма"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
      />
      <Button
        mode="text"
        onPress={() => authApi.requestCode(getValues('email'))}
        style={styles.resend}
        accessibilityLabel="Отправить код снова"
      >
        Отправить снова
      </Button>
    </RegisterStepLayout>
  );
}

const styles = StyleSheet.create({
  resend: {
    alignSelf: 'flex-start',
  },
});
