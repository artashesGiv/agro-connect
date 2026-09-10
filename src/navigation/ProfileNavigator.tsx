import { createNativeStackNavigator } from '@react-navigation/native-stack';

import EditPostScreen from '../features/create/screens/EditPostScreen';
import PostDetailScreen from '../features/post-detail/screens/PostDetailScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

/**
 * Стек вкладки «Профиль». Нативные хедеры выключены — каждый экран рисует
 * общий `AppHeader` сам (единый вид панели по всему приложению).
 */
export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="EditPost" component={EditPostScreen} />
    </Stack.Navigator>
  );
}
