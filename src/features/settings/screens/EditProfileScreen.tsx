import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Keyboard, StyleSheet, View } from 'react-native';
import { Button, HelperText, type MD3Theme } from 'react-native-paper';

import { AppHeader } from '@/components/AppHeader';
import { FormTextInput } from '@/components/FormTextInput';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { RegionSelect } from '@/components/RegionSelect';
import type { EditProfileScreenProps } from '@/navigation/types';
import { useAuth } from '@/services/auth';
import { storage, toUserMessage } from '@/services/supabase';
import { updateProfile } from '@/services/profile';
import { useAppTheme } from '@/theme';

import { AvatarPicker, type PickedAvatar } from '../components/AvatarPicker';
import {
  editProfileSchema,
  type EditProfileFormValues,
} from '../schemas/editProfileSchema';

/** Редактирование данных профиля: имя/специализация/регион + смена аватара. */
export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user, profile, refreshProfile } = useAuth();

  const [newAvatar, setNewAvatar] = useState<PickedAvatar | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: profile?.name ?? '',
      specialization: profile?.specialization ?? '',
      region: profile?.region ?? '',
    },
    mode: 'onTouched',
  });

  const currentAvatarUrl = profile?.avatar_path
    ? storage.getAvatarUrl(profile.avatar_path)
    : undefined;

  const onSubmit = async (values: EditProfileFormValues) => {
    if (!user) return;
    Keyboard.dismiss();
    setFormError(null);
    setSubmitting(true);
    try {
      let avatarPath = profile?.avatar_path ?? null;
      if (newAvatar) {
        const contentType = (
          storage.AVATAR_MIME_TYPES as readonly string[]
        ).includes(newAvatar.mimeType)
          ? (newAvatar.mimeType as storage.AvatarMimeType)
          : 'image/jpeg';
        avatarPath = await storage.uploadAvatar(user.id, newAvatar.uri, contentType);
      }
      await updateProfile(user.id, { ...values, avatar_path: avatarPath });
      await refreshProfile();
      navigation.goBack();
    } catch (cause) {
      setFormError(toUserMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Редактировать профиль" onBack={navigation.goBack} />
      <KeyboardAwareScreen edges={['bottom']} contentContainerStyle={styles.content}>
        <View style={styles.body}>
          <AvatarPicker uri={newAvatar?.uri ?? currentAvatarUrl} onChange={setNewAvatar} />

          {formError ? (
            <HelperText type="error" visible style={styles.formError}>
              {formError}
            </HelperText>
          ) : null}

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
          <RegionSelect control={control} name="region" label="Регион" />

          <Button
            mode="contained"
            loading={submitting}
            disabled={submitting}
            onPress={handleSubmit(onSubmit)}
            style={styles.saveButton}
            accessibilityLabel="Сохранить"
          >
            Сохранить
          </Button>
        </View>
      </KeyboardAwareScreen>
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flexGrow: 1,
      paddingBottom: 24,
    },
    body: {
      paddingHorizontal: 24,
      paddingTop: 20,
    },
    formError: {
      paddingHorizontal: 0,
    },
    saveButton: {
      marginTop: 8,
    },
  });
