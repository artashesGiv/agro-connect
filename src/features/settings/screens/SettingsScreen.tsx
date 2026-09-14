import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, List, Text, type MD3Theme } from 'react-native-paper';
import Constants from 'expo-constants';

import { AppHeader } from '@/components/AppHeader';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ProfileInfo } from '@/components/ProfileInfo';
import type { SettingsScreenProps } from '@/navigation/types';
import { useAuth } from '@/services/auth';
import { storage, toUserMessage } from '@/services/supabase';
import { useAppTheme } from '@/theme';

const APP_VERSION = Constants.expoConfig?.version ?? '—';
const ANDROID_BUILD = Constants.expoConfig?.android?.versionCode;

/**
 * Экран «Настройки»: данные аккаунта, переходы к редактированию профиля и
 * смене пароля, справочные пункты и выход (с подтверждением) внизу.
 */
export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user, profile, signOut } = useAuth();

  const [signOutVisible, setSignOutVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const avatarUrl = profile?.avatar_path
    ? storage.getAvatarUrl(profile.avatar_path)
    : undefined;

  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      // RootNavigator сам переключит стек по смене статуса — навигировать не нужно.
    } catch (cause) {
      setSignOutError(toUserMessage(cause));
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Настройки" onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <ProfileInfo
          profile={{
            name: profile?.name ?? undefined,
            specialization: profile?.specialization ?? undefined,
            region: profile?.region ?? undefined,
            avatarUrl,
          }}
        />
        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}

        <Divider />

        <List.Section>
          <List.Item
            title="Редактировать профиль"
            left={(props) => <List.Icon {...props} icon="account-edit-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <List.Item
            title="Сменить пароль"
            left={(props) => <List.Icon {...props} icon="lock-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Item
            title="О приложении"
            description={
              ANDROID_BUILD ? `Версия ${APP_VERSION} (сборка ${ANDROID_BUILD})` : `Версия ${APP_VERSION}`
            }
            left={(props) => <List.Icon {...props} icon="information-outline" />}
          />
          <List.Item
            title="Поддержка"
            description="+7 (000) 000-00-00"
            left={(props) => <List.Icon {...props} icon="lifebuoy" />}
          />
        </List.Section>

        <View style={styles.signOutWrap}>
          <Button
            mode="contained"
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
            icon="logout"
            onPress={() => setSignOutVisible(true)}
            accessibilityLabel="Выйти из аккаунта"
          >
            Выйти
          </Button>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={signOutVisible}
        title="Выйти из аккаунта?"
        confirmLabel="Выйти"
        destructive
        loading={signingOut}
        error={signOutError}
        onConfirm={handleSignOut}
        onCancel={() => {
          setSignOutVisible(false);
          setSignOutError(null);
        }}
      />
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
      paddingBottom: 32,
    },
    email: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      marginTop: -12,
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    signOutWrap: {
      paddingHorizontal: 16,
      paddingTop: 24,
    },
  });
