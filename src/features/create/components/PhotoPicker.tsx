import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, type MD3Theme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

import { Icon } from '@/components/Icon';
import { useAppTheme } from '@/theme';

export type PickedPhoto = { uri: string; mimeType: string };

type Props = {
  value: PickedPhoto[];
  onChange: (photos: PickedPhoto[]) => void;
};

const SELECTION_LIMIT = 10;

/** Съёмка с камеры / выбор из галереи + превью с удалением. Фото необязательны. */
export function PhotoPicker({ value, onChange }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [error, setError] = useState<string | null>(null);

  const append = (assets: ImagePicker.ImagePickerAsset[]) => {
    const next = assets.map((asset) => ({
      uri: asset.uri,
      mimeType: asset.mimeType ?? 'image/jpeg',
    }));
    onChange([...value, ...next].slice(0, SELECTION_LIMIT));
  };

  const remove = (uri: string) => {
    onChange(value.filter((photo) => photo.uri !== uri));
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
    if (!result.canceled) append(result.assets);
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
    if (!result.canceled) append(result.assets);
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
          {value.map((photo) => (
            <View key={photo.uri} style={styles.thumbWrap}>
              <Image source={{ uri: photo.uri }} style={styles.thumb} />
              <Pressable
                onPress={() => remove(photo.uri)}
                hitSlop={8}
                style={styles.removeButton}
                accessibilityRole="button"
                accessibilityLabel="Убрать фото"
              >
                <Icon name="close" size={16} color={theme.colors.onPrimary} />
              </Pressable>
            </View>
          ))}
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
