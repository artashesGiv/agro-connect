import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Divider,
  Snackbar,
  Text,
  type MD3Theme,
} from 'react-native-paper';

import { AppHeader } from '@/components/AppHeader';
import { PostCard } from '@/components/PostCard';
import { ProfileInfo } from '@/components/ProfileInfo';
import { Screen } from '@/components/Screen';
import { useFields } from '@/hooks/useFields';
import { useReactions } from '@/hooks/useReactions';
import type { UserProfileScreenProps } from '@/navigation/types';
import { useAuth } from '@/services/auth';
import { getProfile, type Profile } from '@/services/profile';
import { toggleReactionSummary } from '@/services/reactions';
import { storage, toUserMessage } from '@/services/supabase';
import { useAppTheme } from '@/theme';

import { FieldsSection } from '../components/FieldsSection';
import {
  ProfileSectionTabs,
  type ProfileSection,
} from '../components/ProfileSectionTabs';
import { useUserPosts } from '../hooks/useUserPosts';

/**
 * Чужой профиль — read-only, без гейра/выхода. «Без имени» вместо «Укажите
 * имя»: это чужая страница, не своя, инструкция себе тут неуместна.
 */
const OTHER_PROFILE_PLACEHOLDERS = { name: 'Без имени' };
const SECTION_LABELS = { posts: 'Посты', fields: 'Поля' };

/**
 * Профиль другого пользователя: карточка профиля + переключатель «Посты»/«Поля».
 * «Посты» — реальная лента автора (`useUserPosts`, тот же хук, что и «Мои посты»
 * на своём профиле); «Поля» — только просмотр, без правки (`FieldsSection
 * editable={false}`). Вход — тап по аватару/имени автора где угодно в
 * приложении, или карточка чужого поля на карте.
 */
export default function UserProfileScreen({ route, navigation }: UserProfileScreenProps) {
  const { userId } = route.params;
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user } = useAuth();
  const viewerId = user?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setProfileLoading(true);
    setProfileError(null);
    getProfile(userId)
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch((cause: unknown) => {
        if (active) setProfileError(toUserMessage(cause));
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const [section, setSection] = useState<ProfileSection>('posts');
  const {
    posts,
    setPosts,
    loading: postsLoading,
    error: postsError,
    syncItem,
  } = useUserPosts(userId);
  const { setReaction } = useReactions();
  const {
    fields: allFields,
    loading: fieldsLoading,
    error: fieldsError,
    reload: reloadFields,
  } = useFields();
  const fields = useMemo(
    () => allFields.filter((field) => field.owner_id === userId),
    [allFields, userId],
  );

  const [notice, setNotice] = useState<string | null>(null);
  /** id поста, открытого в PostDetail — перечитываем его при возврате. */
  const openedRef = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const openedId = openedRef.current;
      openedRef.current = null;
      if (openedId) void syncItem(openedId);
      void reloadFields();
    }, [syncItem, reloadFields]),
  );

  const openPost = useCallback(
    (postId: string) => {
      openedRef.current = postId;
      navigation.navigate('PostDetail', { postId });
    },
    [navigation],
  );

  const openField = useCallback(
    (fieldId: string | null, withCard: boolean) => {
      if (!fieldId) return;
      navigation.navigate('Tabs', {
        screen: 'Map',
        params: { focusFieldId: fieldId, openCard: withCard },
      });
    },
    [navigation],
  );

  const openAuthor = useCallback(
    (authorId: string) => {
      if (authorId && authorId === viewerId) {
        navigation.navigate('Tabs', { screen: 'Profile' });
      } else {
        navigation.navigate('UserProfile', { userId: authorId });
      }
    },
    [navigation, viewerId],
  );

  const handleToggleReaction = useCallback(
    async (postId: string, code: string) => {
      if (!viewerId) return;
      const target = posts.find((post) => post.id === postId);
      if (!target) return;
      const { next, previousCode, nextCode } = toggleReactionSummary(
        target.reactions,
        code,
      );
      const snapshot = posts;
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, reactions: next } : post)),
      );
      try {
        await setReaction({
          postId,
          userId: viewerId,
          previous: previousCode,
          next: nextCode,
        });
      } catch (cause) {
        setPosts(snapshot);
        setNotice(
          cause instanceof Error ? cause.message : 'Не удалось сохранить реакцию.',
        );
      }
    },
    [posts, viewerId, setPosts, setReaction],
  );

  const avatarUrl = profile?.avatar_path
    ? storage.getAvatarUrl(profile.avatar_path)
    : undefined;

  return (
    <Screen edges={['bottom']}>
      <AppHeader title={profile?.name ?? 'Профиль'} onBack={navigation.goBack} />
      {profileLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : profileError ? (
        <Text style={styles.stateText}>{profileError}</Text>
      ) : !profile ? (
        <Text style={styles.stateText}>Профиль не найден.</Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ProfileInfo
            profile={{
              name: profile.name ?? undefined,
              specialization: profile.specialization ?? undefined,
              region: profile.region ?? undefined,
              avatarUrl,
              reputation: profile.reputation,
            }}
            placeholders={OTHER_PROFILE_PLACEHOLDERS}
          />
          <Divider />
          <ProfileSectionTabs value={section} onChange={setSection} labels={SECTION_LABELS} />

          <View style={styles.section}>
            {section === 'fields' ? (
              <FieldsSection
                fields={fields}
                loading={fieldsLoading}
                error={fieldsError}
                editable={false}
                onOpen={openField}
              />
            ) : postsError && posts.length === 0 ? (
              <Text style={styles.stateText}>{postsError}</Text>
            ) : postsLoading && posts.length === 0 ? (
              <ActivityIndicator style={styles.loader} />
            ) : posts.length === 0 ? (
              <Text style={styles.stateText}>Постов пока нет</Text>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  author={post.author}
                  title={post.title}
                  description={post.description}
                  images={post.images}
                  onAuthorPress={() => openAuthor(post.author.id)}
                  createdAt={post.createdAt}
                  reactions={post.reactions}
                  onToggleReaction={(code) => handleToggleReaction(post.id, code)}
                  commentCount={post.commentCount}
                  onComment={() => openPost(post.id)}
                  onMap={post.fieldId ? () => openField(post.fieldId, false) : undefined}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}

      <Snackbar visible={notice !== null} onDismiss={() => setNotice(null)} duration={4000}>
        {notice ?? ''}
      </Snackbar>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    content: {
      flexGrow: 1,
      paddingBottom: 24,
    },
    section: {
      flex: 1,
    },
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
