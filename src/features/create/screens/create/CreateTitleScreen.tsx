import { useFormContext, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { FormTextInput } from '@/components/FormTextInput';
import { Icon } from '@/components/Icon';
import type { CreateTitleScreenProps } from '@/navigation/types';
import { useAppTheme } from '@/theme';

import { CreateStepLayout } from '../../components/CreateStepLayout';
import { PostTypeToggle } from '../../components/PostTypeToggle';
import { useCreatePostMeta } from '../../forms/CreatePostProvider';
import {
  CREATE_STEP_FIELDS,
  type CreatePostFormValues,
} from '../../schemas/createPostSchema';

/** Совпадает с проверкой на бэкенде (`process-ai-post`) — там ищет ровно так же. */
const AI_MENTION_RE = /(^|\s)@ai\b/i;

export default function CreateTitleScreen({ navigation }: CreateTitleScreenProps) {
  const theme = useAppTheme();
  const { control, trigger, setValue } = useFormContext<CreatePostFormValues>();
  const { postId } = useCreatePostMeta();
  const postTypeCode = useWatch({ control, name: 'postTypeCode' });
  const body = useWatch({ control, name: 'body' });
  const hasAiMention = AI_MENTION_RE.test(body ?? '');
  const aiColor = hasAiMention ? theme.colors.primary : theme.colors.onSurfaceVariant;

  const handleNext = async () => {
    if (!(await trigger(CREATE_STEP_FIELDS.title))) return;
    navigation.navigate('CreatePhotos');
  };

  const handleInsertAiMention = () => {
    if (hasAiMention) return;
    const base = (body ?? '').replace(/\s+$/, '');
    setValue('body', base.length > 0 ? `${base} @ai ` : '@ai ', {
      shouldDirty: true,
    });
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
      <Pressable
        onPress={handleInsertAiMention}
        disabled={hasAiMention}
        hitSlop={8}
        style={styles.aiButton}
        accessibilityRole="button"
        accessibilityLabel="Добавить упоминание ИИ-помощника в описание"
        accessibilityState={{ disabled: hasAiMention }}
      >
        <Icon name="robot-outline" size={16} color={aiColor} />
        <Text style={[styles.aiButtonText, { color: aiColor }]}>
          {hasAiMention ? '@ai добавлено — спросим при публикации' : 'Спросить ИИ-помощника (@ai)'}
        </Text>
      </Pressable>
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
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 6,
  },
  aiButtonText: {
    fontSize: 13,
  },
});
