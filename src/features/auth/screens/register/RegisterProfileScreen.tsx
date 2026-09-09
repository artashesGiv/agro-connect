import { useFormContext } from 'react-hook-form';

import type { RegisterProfileScreenProps } from '@/navigation/types';

import { FormTextInput } from '@/components/FormTextInput';
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

  // Поля повторяют колонки `profiles`. Справочников под специализацию и регион
  // в схеме БД нет, поэтому пока свободный ввод.
  return (
    <RegisterStepLayout
      step={2}
      title="О себе"
      subtitle="Как вас показывать другим пользователям."
      onBack={navigation.goBack}
      onNext={handleNext}
    >
      <FormTextInput
        control={control}
        name="name"
        label="Имя"
        autoComplete="name"
        textContentType="name"
      />
      <FormTextInput
        control={control}
        name="specialization"
        label="Специализация"
        placeholder="Например, растениеводство"
      />
      <FormTextInput
        control={control}
        name="region"
        label="Регион"
        placeholder="Например, Краснодарский край"
      />
    </RegisterStepLayout>
  );
}
