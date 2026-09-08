import { useFormContext } from 'react-hook-form';

import { authApi } from '../../../../services/auth';
import type { RegisterEmailScreenProps } from '../../../../navigation/types';
import { FormTextInput } from '../../components/FormTextInput';
import { RegisterStepLayout } from '../../components/RegisterStepLayout';
import {
  REGISTER_STEP_FIELDS,
  type RegisterFormValues,
} from '../../schemas/registerSchema';

export default function RegisterEmailScreen({ navigation }: RegisterEmailScreenProps) {
  const { control, trigger, getValues } = useFormContext<RegisterFormValues>();

  const handleNext = async () => {
    if (!(await trigger(REGISTER_STEP_FIELDS.email))) return;
    void authApi.requestCode(getValues('email'));
    navigation.navigate('RegisterCode');
  };

  return (
    <RegisterStepLayout
      step={1}
      title="Ваш email"
      subtitle="На него придёт код подтверждения."
      onBack={navigation.goBack}
      onNext={handleNext}
    >
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
    </RegisterStepLayout>
  );
}
