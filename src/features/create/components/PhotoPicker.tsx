import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, type MD3Theme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

import { Icon } from '@/components/Icon';
import { deletePersistedPhoto, persistPickedPhoto } from '@/services/postQueue';
import { useAppTheme } from '@/theme';

import type { PhotoItem } from '../schemas/createPostSchema';

type Props = {
  value: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
};

const SELECTION_LIMIT = 10;

const keyOf = (photo: PhotoItem) => (photo.kind === 'new' ? photo.uri : photo.id);
const uriOf = (photo: PhotoItem) => (photo.kind === 'new' ? photo.uri : photo.url);

/**
 * Съёмка с камеры / выбор из галереи + превью с удалением. Фото необязательны.
 * Уже загруженные фото (`kind: 'existing'`) приходят при редактировании и
 * показываются так же; «удалить» просто выкидывает элемент из массива, а дифф
 * с сервером считает `updatePostWithMedia`.
 */
export function PhotoPicker({ value, onChange }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [error, setError] = useState<string | null>(null);

  // Копируем в постоянное хранилище сразу при выборе — не только когда уже
  // известно, что сети нет: кэш-каталог пикера ОС может очистить в любой
  // момент, а сеть может пропасть и позже, между выбором фото и отправкой.
  const append = async (assets: ImagePicker.ImagePickerAsset[]) => {
    try {
      const next: PhotoItem[] = await Promise.all(
        assets.map(async (asset) => ({
          kind: 'new' as const,
          uri: await persistPickedPhoto(asset.uri),
          mimeType: asset.mimeType ?? 'image/jpeg',
        })),
      );
      onChange([...value, ...next].slice(0, SELECTION_LIMIT));
    } catch {
      setError('Не удалось сохранить фото. Попробуйте ещё раз.');
    }
  };

  const remove = (key: string) => {
    const photo = value.find((item) => keyOf(item) === key);
    if (photo?.kind === 'new') deletePersistedPhoto(photo.uri);
    onChange(value.filter((item) => keyOf(item) !== key));
  };

  const takePhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Нужен доступ к камере.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) await append(result.assets);
  };

  const pickFromLibrary = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Нужен доступ к галерее.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: SELECTION_LIMIT,
      quality: 0.7,
    });
    if (!result.canceled) await append(result.assets);
  };

  const full = value.length >= SELECTION_LIMIT;

  return (
    <View>
      <View style={styles.buttons}>
        <Button
          mode="outlined"
          icon="camera-outline"
          onPress={takePhoto}
          disabled={full}
          style={styles.button}
        >
          Сфотографировать
        </Button>
        <Button
          mode="outlined"
          icon="image-multiple-outline"
          onPress={pickFromLibrary}
          disabled={full}
          style={styles.button}
        >
          Из галереи
        </Button>
      </View>

      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : null}

      {value.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.previews}
        >
          {value.map((photo) => {
            const key = keyOf(photo);
            return (
              <View key={key} style={styles.thumbWrap}>
                <Image source={{ uri: uriOf(photo) }} style={styles.thumb} />
                <Pressable
                  onPress={() => remove(key)}
                  hitSlop={8}
                  style={styles.removeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Убрать фото"
                >
                  <Icon name="close" size={16} color={theme.colors.onPrimary} />
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    buttons: {
      gap: 10,
    },
    button: {
      alignSelf: 'stretch',
    },
    previews: {
      gap: 10,
      paddingVertical: 12,
    },
    thumbWrap: {
      width: 96,
      height: 96,
    },
    thumb: {
      width: 96,
      height: 96,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceVariant,
    },
    removeButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
  });
