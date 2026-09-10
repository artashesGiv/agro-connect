import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { HelperText } from 'react-native-paper';

import { PostCard } from '@/components/PostCard';
import type { CreatePreviewScreenProps } from '@/navigation/types';
import { useAuth } from '@/services/auth';
import { createPostWithMedia, updatePostWithMedia } from '@/services/posts';
import { storage, toUserMessage } from '@/services/supabase';

import { CreateStepLayout } from '../../components/CreateStepLayout';
import { useCreatePostMeta } from '../../forms/CreatePostProvider';
import type { CreatePostFormValues } from '../../schemas/createPostSchema';

export default function CreatePreviewScreen({
  navigation,
}: CreatePreviewScreenProps) {
  const { user, profile } = useAuth();
  const { postId } = useCreatePostMeta();
  const isEdit = postId !== null;
  const { handleSubmit, formState, reset, getValues } =
    useFormContext<CreatePostFormValues>();
  const [error, setError] = useState<string | null>(null);

  // Значения уже собраны на прошлых шагах и на этом экране не меняются —
  // снимок через getValues достаточно.
  const values = getValues();
  const avatarUrl = profile?.avatar_path
    ? storage.getAvatarUrl(profile.avatar_path)
    : undefined;

  const submit = handleSubmit(async (data) => {
    if (!user) {
      setError('Сессия не найдена. Войдите заново.');
      return;
    }
    setError(null);
    const input = {
      postTypeCode: data.postTypeCode,
      title: data.title,
      body: data.body,
    };
    const newPhotos = data.photos
      .filter((photo) => photo.kind === 'new')
      .map((photo) => ({ uri: photo.uri, mimeType: photo.mimeType }));

    try {
      if (isEdit) {
        await updatePostWithMedia(postId, user.id, input, {
          newPhotos,
          keepMediaIds: data.photos
            .filter((photo) => photo.kind === 'existing')
            .map((photo) => photo.id),
        });
        // Родитель мастера — стек профиля; закрываем экран EditPost.
        navigation.getParent()?.goBack();
        return;
      }

      await createPostWithMedia(user.id, input, newPhotos);
      reset();
      // Родитель мастера — таб-навигатор; уводим на «Профиль», где виден пост.
      navigation.getParent()?.navigate('Profile' as never);
      navigation.popToTop();
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  });

  return (
    <CreateStepLayout
      step={5}
      title={isEdit ? 'Проверьте изменения' : 'Проверьте пост'}
      subtitle="Так он будет выглядеть в ленте."
      onBack={navigation.goBack}
      onNext={submit}
      nextLabel={isEdit ? 'Сохранить' : 'Опубликовать'}
      nextLoading={formState.isSubmitting}
    >
      <View style={styles.previewWrap}>
        <PostCard
          author={{ nickname: profile?.name ?? 'вы', avatarUrl }}
          title={values.title}
          description={values.body || undefined}
          images={values.photos.map((photo) =>
            photo.kind === 'new' ? photo.uri : photo.url,
          )}
        />
      </View>
      {error ? (
        <HelperText type="error" visible style={styles.error}>
          {error}
        </HelperText>
      ) : null}
    </CreateStepLayout>
  );
}

const styles = StyleSheet.create({
  previewWrap: {
    marginHorizontal: -24,
  },
  error: {
    paddingHorizontal: 0,
  },
});
