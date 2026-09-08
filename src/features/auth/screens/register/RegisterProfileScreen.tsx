import { useFormContext } from 'react-hook-form';

import type { RegisterProfileScreenProps } from '../../../../navigation/types';
import { FormTextInput } from '../../components/FormTextInput';
import { RegisterStepLayout } from '../../components/RegisterStepLayout';
import {
  REGISTER_STEP_FIELDS,
  type RegisterFormValues,
} from '../../schemas/registerSchema';

export default function RegisterProfileScreen({
  navigation,
}: RegisterProfileScreenProps) {
  const { control, trigger } = useFormContext<RegisterFormValues>();

  const handleNext = async () => {
    if (!(await trigger(REGISTER_STEP_FIELDS.profile))) return;
    navigation.navigate('RegisterPassword');
  };

  return (
    <RegisterStepLayout
      step={3}
      title="О себе"
      subtitle="Как вас показывать другим пользователям."
      onBack={navigation.goBack}
      onNext={handleNext}
    >
      <FormTextInput
        control={control}
        name="firstName"
        label="Имя"
        autoComplete="given-name"
        textContentType="givenName"
      />
      <FormTextInput
        control={control}
        name="lastName"
        label="Фамилия"
        autoComplete="family-name"
        textContentType="familyName"
      />
      <FormTextInput
        control={control}
        name="nickname"
        label="Никнейм"
        autoCapitalize="none"
        autoComplete="username"
        textContentType="nickname"
        autoCorrect={false}
      />
    </RegisterStepLayout>
  );
}
