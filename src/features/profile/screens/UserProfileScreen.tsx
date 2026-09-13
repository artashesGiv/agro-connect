import { useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ActivityIndicator, Text, type MD3Theme } from 'react-native-paper';

import { AppHeader } from '@/components/AppHeader';
import { ProfileInfo } from '@/components/ProfileInfo';
import { Screen } from '@/components/Screen';
import type { UserProfileScreenProps } from '@/navigation/types';
import { getProfile, type Profile } from '@/services/profile';
import { storage, toUserMessage } from '@/services/supabase';
import { useAppTheme } from '@/theme';

/**
 * Чужой профиль — read-only, без гейра/выхода и вкладок «Мои посты» и т.п.
 * «Без имени» вместо «Укажите имя»: это чужая страница, не своя, инструкция
 * себе тут неуместна. Специализация/регион при пустом значении просто не
 * рисуются — `ProfileInfo` уже так спроектирован для чужого профиля.
 */
const OTHER_PROFILE_PLACEHOLDERS = { name: 'Без имени' };

/**
 * Профиль другого пользователя. Сейчас единственный вход — кнопка «Профиль»
 * в карточке чужого поля на карте.
 */
export default function UserProfileScreen({ route, navigation }: UserProfileScreenProps) {
  const { userId } = route.params;
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getProfile(userId)
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch((cause: unknown) => {
        if (active) setError(toUserMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const avatarUrl = profile?.avatar_path
    ? storage.getAvatarUrl(profile.avatar_path)
    : undefined;

  return (
    <Screen edges={['bottom']}>
      <AppHeader title="Профиль" onBack={navigation.goBack} />
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : error ? (
        <Text style={styles.stateText}>{error}</Text>
      ) : !profile ? (
        <Text style={styles.stateText}>Профиль не найден.</Text>
      ) : (
        <ProfileInfo
          profile={{
            name: profile.name ?? undefined,
            specialization: profile.specialization ?? undefined,
            region: profile.region ?? undefined,
            avatarUrl,
          }}
          placeholders={OTHER_PROFILE_PLACEHOLDERS}
        />
      )}
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    loader: {
      marginTop: 48,
    },
    stateText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      textAlign: 'center',
      marginTop: 48,
      paddingHorizontal: 24,
    },
  });
