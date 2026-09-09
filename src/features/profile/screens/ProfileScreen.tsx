import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Divider, Text, type MD3Theme } from 'react-native-paper';

import { PostCard } from '../../../components/PostCard';
import { ProfileInfo } from '../../../components/ProfileInfo';
import { useAuth } from '../../../services/auth';
import { useAppTheme } from '../../../theme';
import { ProfileHeader } from '../components/ProfileHeader';
import {
  ProfileSectionTabs,
  type ProfileSection,
} from '../components/ProfileSectionTabs';
import { useUserPosts } from '../hooks/useUserPosts';

/** Подсказки для незаполненных полей своего профиля. */
const OWN_PROFILE_PLACEHOLDERS = {
  name: 'Укажите имя и фамилию',
  specialization: 'Укажите специализацию',
  region: 'Укажите регион',
  phone: 'Добавьте номер телефона',
};

/**
 * Вкладка «Профиль»: своя шапка (уведомления / @ник / настройки), карточка
 * профиля (общий компонент `ProfileInfo`) и переключатель «Мои посты / Закладки».
 * «Мои посты» рендерит список `PostCard` из моковой загрузки (`useUserPosts`).
 *
 * Экран не обёрнут в `ScreenContainer`: у него фиксированная `Appbar.Header` над
 * скроллом — верхнюю safe-area врезку даёт она сама, нижнюю — таб-бар.
 */
export default function ProfileScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user } = useAuth();
  const [section, setSection] = useState<ProfileSection>('posts');
  const { posts, loading } = useUserPosts(user?.id);

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
          {section === 'bookmarks' ? (
            <Text style={styles.stateText}>Закладки</Text>
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
                bookmarked={post.bookmarked}
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
