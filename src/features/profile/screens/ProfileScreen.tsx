import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Divider, Text, type MD3Theme } from 'react-native-paper';

import { ProfileInfo } from '../../../components/ProfileInfo';
import { useAuth } from '../../../services/auth';
import { useAppTheme } from '../../../theme';
import { ProfileHeader } from '../components/ProfileHeader';
import {
  ProfileSectionTabs,
  type ProfileSection,
} from '../components/ProfileSectionTabs';

/** Подсказки для незаполненных полей своего профиля. */
const OWN_PROFILE_PLACEHOLDERS = {
  name: 'Укажите имя и фамилию',
  specialization: 'Укажите специализацию',
  region: 'Укажите регион',
  phone: 'Добавьте номер телефона',
};

/**
 * Вкладка «Профиль»: своя шапка (уведомления / @ник / настройки), карточка
 * профиля (общий компонент `ProfileInfo` — тот же для чужих профилей) и
 * переключатель «Мои посты / Закладки».
 *
 * Экран не обёрнут в `ScreenContainer`: у него фиксированная `Appbar.Header` над
 * скроллом — верхнюю safe-area врезку даёт она сама, нижнюю — таб-бар.
 */
export default function ProfileScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user } = useAuth();
  const [section, setSection] = useState<ProfileSection>('posts');

  return (
    <View style={styles.root}>
      <ProfileHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ProfileInfo
          profile={{
            firstName: user?.firstName,
            lastName: user?.lastName,
            specialization: user?.specialization,
            region: user?.region,
            phone: user?.phone,
          }}
          placeholders={OWN_PROFILE_PLACEHOLDERS}
        />
        <Divider />
        <ProfileSectionTabs value={section} onChange={setSection} />
        <View style={styles.section}>
          <Text style={styles.sectionText}>
            {section === 'posts' ? 'Мои посты' : 'Закладки'}
          </Text>
        </View>
      </ScrollView>
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
    section: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 48,
    },
    sectionText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
    },
  });
