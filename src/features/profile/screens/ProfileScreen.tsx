import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, type MD3Theme } from 'react-native-paper';

import { useAuth } from '@/services/auth';
import { storage } from '@/services/supabase';
import { useAppTheme } from '@/theme';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user, profile, signOut } = useAuth();

  // avatar_path хранится в БД, публичный URL строим локально.
  const avatarUrl = profile?.avatar_path
    ? storage.getAvatarUrl(profile.avatar_path)
    : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.info}>
        {avatarUrl ? (
          <Avatar.Image size={72} source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : null}
        <Text style={styles.name}>{profile?.name ?? 'Профиль'}</Text>
        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
        {profile?.specialization ? (
          <Text style={styles.meta}>{profile.specialization}</Text>
        ) : null}
        {profile?.region ? <Text style={styles.meta}>{profile.region}</Text> : null}
        <Text style={styles.meta}>{`Репутация: ${profile?.reputation ?? 0}`}</Text>
      </View>

      <Button
        mode="contained"
        buttonColor={theme.colors.errorContainer}
        textColor={theme.colors.onErrorContainer}
        onPress={signOut}
        style={styles.signOutButton}
        accessibilityLabel="Выйти из аккаунта"
      >
        Выйти
      </Button>
    </ScrollView>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    info: {
      marginBottom: 24,
    },
    name: {
      color: theme.colors.onBackground,
      fontSize: 28,
      fontWeight: '800',
      marginBottom: 8,
    },
    email: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
    },
    meta: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      marginTop: 4,
    },
    avatar: {
      marginBottom: 12,
    },
    signOutButton: {
      marginTop: 'auto',
    },
  });
