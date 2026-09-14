import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar, HelperText, type MD3Theme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

import { Icon } from '@/components/Icon';
import { useAppTheme } from '@/theme';

export type PickedAvatar = { uri: string; mimeType: string };

type Props = {
  /** Текущий аватар (URL с бэка или локальный uri только что выбранного). */
  uri?: string;
  onChange: (asset: PickedAvatar) => void;
};

/**
 * Одиночный круглый picker аватара с обрезкой 1:1. `PhotoPicker` (создание
 * поста) не подходит — он list-shaped: мультивыбор, лента превью, без кропа.
 */
export function AvatarPicker({ uri, onChange }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Нужен доступ к галерее.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    onChange({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' });
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={pick}
        accessibilityRole="button"
        accessibilityLabel="Сменить фото профиля"
      >
        <View>
          {uri ? (
            <Avatar.Image size={96} source={{ uri }} />
          ) : (
            <Avatar.Icon
              size={96}
              icon="account"
              style={styles.placeholder}
              color={theme.colors.onSurfaceVariant}
            />
          )}
          <View style={styles.badge}>
            <Icon name="pencil" size={16} color={theme.colors.onPrimary} />
          </View>
        </View>
      </Pressable>
      {error ? (
        <HelperText type="error" visible style={styles.error}>
          {error}
        </HelperText>
      ) : null}
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    wrap: {
      alignItems: 'center',
      marginBottom: 8,
    },
    placeholder: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    badge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: theme.colors.background,
    },
    error: {
      textAlign: 'center',
    },
  });
