import { useFormContext, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { FormTextInput } from '@/components/FormTextInput';
import type { CreateTitleScreenProps } from '@/navigation/types';

import { CreateStepLayout } from '../../components/CreateStepLayout';
import { PostTypeToggle } from '../../components/PostTypeToggle';
import { useCreatePostMeta } from '../../forms/CreatePostProvider';
import {
  CREATE_STEP_FIELDS,
  type CreatePostFormValues,
} from '../../schemas/createPostSchema';

export default function CreateTitleScreen({ navigation }: CreateTitleScreenProps) {
  const { control, trigger, setValue } = useFormContext<CreatePostFormValues>();
  const { postId } = useCreatePostMeta();
  const postTypeCode = useWatch({ control, name: 'postTypeCode' });

  const handleNext = async () => {
    if (!(await trigger(CREATE_STEP_FIELDS.title))) return;
    navigation.navigate('CreatePhotos');
  };

  return (
    <CreateStepLayout
      step={1}
      title="Текст публикации"
      onNext={handleNext}
      // В режиме редактирования шаг 1 — не корень: «назад» закрывает мастер.
      onBack={postId ? navigation.goBack : undefined}
    >
      <View style={styles.toggle}>
        <Text variant="labelLarge" style={styles.label}>
          Выберите тип
        </Text>
        <PostTypeToggle
          value={postTypeCode}
          onChange={(value) =>
            setValue('postTypeCode', value, { shouldDirty: true })
          }
        />
      </View>
      <FormTextInput control={control} name="title" label="Заголовок" />
      <FormTextInput
        control={control}
        name="body"
        label="Описание"
        placeholder="Что произошло, что заметили, что планируете"
        multiline
        numberOfLines={6}
        style={styles.body}
      />
    </CreateStepLayout>
  );
}

const styles = StyleSheet.create({
  toggle: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  body: {
    minHeight: 140,
  },
});
