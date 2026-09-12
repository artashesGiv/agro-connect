import { createNativeStackNavigator } from '@react-navigation/native-stack';

import EditPostScreen from '../features/create/screens/EditPostScreen';
import PostDetailScreen from '../features/post-detail/screens/PostDetailScreen';
import NotificationsScreen from '../features/notifications/screens/NotificationsScreen';
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
 * принципом: полноэкранные переходы поверх таб-бара. Нативные хедеры выключены —
 * экраны рисуют общий `AppHeader` сами.
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
    </Stack.Navigator>
  );
}
