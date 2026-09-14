import { createNativeStackNavigator } from '@react-navigation/native-stack';

import EditPostScreen from '../features/create/screens/EditPostScreen';
import PostDetailScreen from '../features/post-detail/screens/PostDetailScreen';
import NotificationsScreen from '../features/notifications/screens/NotificationsScreen';
import UserProfileScreen from '../features/profile/screens/UserProfileScreen';
import RelatedPostsScreen from '../features/related-posts/screens/RelatedPostsScreen';
import ChangePasswordScreen from '../features/settings/screens/ChangePasswordScreen';
import EditProfileScreen from '../features/settings/screens/EditProfileScreen';
import SettingsScreen from '../features/settings/screens/SettingsScreen';
import { MainTabs } from './MainTabs';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

/**
 * Стек авторизованной части: таб-навигатор + детальные экраны поста поверх него.
 * `PostDetail` / `EditPost` подняты сюда, чтобы открываться и с «Главной», и с
 * «Профиля». `Settings` / `EditProfile` / `ChangePassword` — туда же, тем же
 * принципом: полноэкранные переходы поверх таб-бара. `UserProfile` — чужой
 * профиль (сейчас единственный вход — карточка чужого поля на карте).
 * `RelatedPosts` — посты и вопросы одного поля (вход — карточка своего поля
 * на карте). Нативные хедеры выключены — экраны рисуют общий `AppHeader` сами.
 */
export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="EditPost" component={EditPostScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="RelatedPosts" component={RelatedPostsScreen} />
    </Stack.Navigator>
  );
}
