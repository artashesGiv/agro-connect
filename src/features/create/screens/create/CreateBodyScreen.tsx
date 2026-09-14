import { useFormContext } from 'react-hook-form';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import { FormTextInput } from '@/components/FormTextInput';
import { Icon } from '@/components/Icon';
import type { CreateBodyScreenProps } from '@/navigation/types';
import { useAppTheme } from '@/theme';

import { CreateStepLayout } from '../../components/CreateStepLayout';
import type { CreatePostFormValues } from '../../schemas/createPostSchema';

/** Совпадает с проверкой на бэкенде (`process-ai-post`) — там ищет ровно так же. */
const AI_MENTION_RE = /(^|\s)@ai\b/i;

export default function CreateBodyScreen({ navigation }: CreateBodyScreenProps) {
  const theme = useAppTheme();
  const { control, watch, setValue } = useFormContext<CreatePostFormValues>();
  const body = watch('body');
  const hasAiMention = AI_MENTION_RE.test(body ?? '');

  const handleInsertAiMention = () => {
    if (hasAiMention) return;
    const base = (body ?? '').replace(/\s+$/, '');
    setValue('body', base.length > 0 ? `${base} @ai ` : '@ai ', {
      shouldDirty: true,
    });
  };

  return (
    <CreateStepLayout
      step={2}
      title="Описание"
      subtitle="Подробности. Не обязательно."
      onBack={navigation.goBack}
      onNext={() => navigation.navigate('CreatePhotos')}
    >
      <FormTextInput
        control={control}
        name="body"
        label="Описание"
        placeholder="Что произошло, что заметили, что планируете"
        multiline
        numberOfLines={6}
        style={styles.input}
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
        <Icon
          name="robot-outline"
          size={16}
          color={hasAiMention ? theme.colors.primary : theme.colors.onSurfaceVariant}
        />
        <Text
          style={[
            styles.aiButtonText,
            { color: hasAiMention ? theme.colors.primary : theme.colors.onSurfaceVariant },
          ]}
        >
          {hasAiMention ? '@ai добавлено — спросим при публикации' : 'Спросить ИИ-помощника (@ai)'}
        </Text>
      </Pressable>
    </CreateStepLayout>
  );
}

const styles = StyleSheet.create({
  input: {
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
