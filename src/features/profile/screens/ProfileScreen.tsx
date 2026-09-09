import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Divider, Text, type MD3Theme } from 'react-native-paper';

import { PostCard } from '@/components/PostCard';
import { ProfileInfo } from '@/components/ProfileInfo';
import { useAuth } from '@/services/auth';
import { storage } from '@/services/supabase';
import { useAppTheme } from '@/theme';

import { ProfileHeader } from '../components/ProfileHeader';
import {
  ProfileSectionTabs,
  type ProfileSection,
} from '../components/ProfileSectionTabs';
import { useUserPosts } from '../hooks/useUserPosts';

/** Подсказки для незаполненных полей своего профиля. */
const OWN_PROFILE_PLACEHOLDERS = {
  name: 'Укажите имя',
  specialization: 'Укажите специализацию',
  region: 'Укажите регион',
};

/**
 * Вкладка «Профиль»: своя шапка (уведомления / @имя / настройки), карточка
 * профиля (общий компонент `ProfileInfo`, данные из строки `profiles`) и
 * переключатель «Мои посты / Закладки». «Мои посты» — реальные посты автора
 * из ленты (`useUserPosts`).
 *
 * Экран не обёрнут в `Screen`: у него фиксированная `Appbar.Header` над скроллом —
 * верхнюю safe-area врезку даёт она сама, нижнюю — таб-бар.
 */
export default function ProfileScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user, profile } = useAuth();
  const [section, setSection] = useState<ProfileSection>('posts');
  const { posts, loading, error } = useUserPosts(user?.id);

  const avatarUrl = profile?.avatar_path
    ? storage.getAvatarUrl(profile.avatar_path)
    : undefined;

  return (
    <View style={styles.root}>
      <ProfileHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ProfileInfo
          profile={{
            name: profile?.name ?? undefined,
            specialization: profile?.specialization ?? undefined,
            region: profile?.region ?? undefined,
            avatarUrl,
          }}
          placeholders={OWN_PROFILE_PLACEHOLDERS}
        />
        <Divider />
        <ProfileSectionTabs value={section} onChange={setSection} />

        <View style={styles.section}>
          {section === 'bookmarks' ? (
            <Text style={styles.stateText}>Закладки</Text>
          ) : error ? (
            <Text style={styles.stateText}>{error}</Text>
          ) : loading ? (
            <ActivityIndicator style={styles.loader} />
          ) : posts.length === 0 ? (
            <Text style={styles.stateText}>Постов пока нет</Text>
          ) : (
            // .map, а не FlatList — список внутри ScrollView. Заменить на FlatList,
            // когда постов станет много / появится пагинация.
            posts.map((post) => (
              <PostCard
                key={post.id}
                author={post.author}
                title={post.title}
                description={post.description}
                images={post.images}
              />
            ))
          )}
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
    },
    loader: {
      marginTop: 32,
    },
    stateText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 32,
      paddingHorizontal: 24,
    },
  });
