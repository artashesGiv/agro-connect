import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar, HelperText, Menu, type MD3Theme } from 'react-native-paper';
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
 * Одиночный круглый picker аватара с обрезкой 1:1. Тап открывает меню
 * «Сделать фото» / «Из галереи» — `PhotoPicker` (создание поста) не подходит,
 * он list-shaped: мультивыбор, лента превью, без единой круглой рамки.
 */
export function AvatarPicker({ uri, onChange }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleResult = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    const asset = result.assets[0];
    onChange({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' });
  };

  const takePhoto = async () => {
    setMenuOpen(false);
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Нужен доступ к камере.');
      return;
    }
    handleResult(
      await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      }),
    );
  };

  const pickFromLibrary = async () => {
    setMenuOpen(false);
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Нужен доступ к галерее.');
      return;
    }
    handleResult(
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      }),
    );
  };

  return (
    <View style={styles.wrap}>
      <Menu
        visible={menuOpen}
        onDismiss={() => setMenuOpen(false)}
        contentStyle={styles.menuContent}
        anchor={
          <Pressable
            onPress={() => setMenuOpen(true)}
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
        }
      >
        <Menu.Item
          leadingIcon={() => (
            <Icon name="camera-outline" size={20} color={theme.colors.onSurface} />
          )}
          title="Сделать фото"
          titleStyle={styles.menuItemText}
          onPress={takePhoto}
        />
        <Menu.Item
          leadingIcon={() => (
            <Icon name="image-multiple-outline" size={20} color={theme.colors.onSurface} />
          )}
          title="Из галереи"
          titleStyle={styles.menuItemText}
          onPress={pickFromLibrary}
        />
      </Menu>
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
    menuContent: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    menuItemText: {
      color: theme.colors.onSurface,
    },
    error: {
      textAlign: 'center',
    },
  });
