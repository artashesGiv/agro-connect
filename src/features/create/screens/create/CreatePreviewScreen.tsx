import { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { HelperText, type MD3Theme } from 'react-native-paper';

import { PostCard } from '@/components/PostCard';
import type { CreatePreviewScreenProps } from '@/navigation/types';
import { useAuth } from '@/services/auth';
import { createPostWithMedia } from '@/services/posts';
import { storage, toUserMessage } from '@/services/supabase';
import { useAppTheme } from '@/theme';

import { CreateStepLayout } from '../../components/CreateStepLayout';
import type { CreatePostFormValues } from '../../schemas/createPostSchema';

export default function CreatePreviewScreen({
  navigation,
}: CreatePreviewScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user, profile } = useAuth();
  const { handleSubmit, formState, reset, getValues } =
    useFormContext<CreatePostFormValues>();
  const [error, setError] = useState<string | null>(null);

  // Значения уже собраны на прошлых шагах и на этом экране не меняются —
  // снимок через getValues достаточно.
  const values = getValues();
  const avatarUrl = profile?.avatar_path
    ? storage.getAvatarUrl(profile.avatar_path)
    : undefined;

  const publish = handleSubmit(async (data) => {
    if (!user) {
      setError('Сессия не найдена. Войдите заново.');
      return;
    }
    setError(null);
    try {
      await createPostWithMedia(
        user.id,
        { postTypeCode: data.postTypeCode, title: data.title, body: data.body },
        data.photos,
      );
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
      title="Проверьте пост"
      subtitle="Так он будет выглядеть в ленте."
      onBack={navigation.goBack}
      onNext={publish}
      nextLabel="Опубликовать"
      nextLoading={formState.isSubmitting}
    >
      <View style={styles.previewWrap}>
        <PostCard
          author={{ nickname: profile?.name ?? 'вы', avatarUrl }}
          title={values.title}
          description={values.body || undefined}
          images={values.photos.map((photo) => photo.uri)}
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

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    previewWrap: {
      marginHorizontal: -24,
    },
    error: {
      paddingHorizontal: 0,
    },
  });
