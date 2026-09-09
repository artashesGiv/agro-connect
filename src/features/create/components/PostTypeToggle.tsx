import { SegmentedButtons } from 'react-native-paper';

import type { CreatePostFormValues } from '../schemas/createPostSchema';

type PostType = CreatePostFormValues['postTypeCode'];

type Props = {
  value: PostType;
  onChange: (value: PostType) => void;
};

/** Тип поста — единственный способ задать обязательный `post_type_id`. */
export function PostTypeToggle({ value, onChange }: Props) {
  return (
    <SegmentedButtons
      value={value}
      onValueChange={(next) => onChange(next as PostType)}
      buttons={[
        { value: 'field_update', label: 'Пост', icon: 'sprout-outline' },
        { value: 'question', label: 'Вопрос', icon: 'help-circle-outline' },
      ]}
    />
  );
}
